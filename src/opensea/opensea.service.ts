import { AxiosError } from 'axios';
import { Cache } from 'cache-manager';
import { get } from 'lodash';
import { join } from 'path';
import { catchError, firstValueFrom } from 'rxjs';
import { URL } from 'url';

import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

import { CollectionStatData } from '../collection/collection.dto';
import { openseaConfig } from '../lib/configs/opensea.config';
import { SaleHistory } from '../saleHistory/saleHistory.dto';

interface ICollection {
    paymentToken: {
        symbol: string
        priceInUSD: number
    },
    volume: {
        total: number
        hourly: number
        daily: number
        weekly: number
        monthly: number
    },
    sales: {
        total: number
        hourly: number
        daily: number
        weekly: number
        monthly: number
    },
    price: {
        hourly: number
        daily: number
        weekly: number
        monthly: number
    },
    supply: number
    floorPrice: number
    netGrossEarning: number
}

@Injectable()
export class OpenseaService {
    constructor(
        private readonly httpRequest: HttpService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    async callOpenSea<T>(url, params): Promise<T> {
        const { data } = await firstValueFrom(
            this.httpRequest.get(url, params).pipe(
                catchError((error: AxiosError) => {
                    throw new Error(`Bad response from opensea: ${error.response.status}/${error.response.statusText}/${JSON.stringify(params)}`);
                })
            )
        );
        return data;
    }

    async getCollection(slug: string): Promise<ICollection> {
        const endpoint = join('/api/v1/collection', slug);
        const url = new URL(endpoint, openseaConfig.url).toString();
        const cache = await this.cacheManager.get(url) as string;
        if (cache) {
            try {
                // it should be a recoverable JSON string
                // but need to check if the string had been hacked
                return JSON.parse(cache);
            } catch (err) {
                throw new Error('invalid cache data');
            }
        }
        const headers = {
            'X-API-KEY': openseaConfig.apiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'Vibe platform',
        };

        const data = await this.callOpenSea<any>(url, { headers });

        const rs = {
            paymentToken: {
                symbol: get(data, 'collection.payment_tokens.0.symbol'),
                priceInUSD: get(data, 'collection.payment_tokens.0.usd_price'),
            },
            volume: {
                total: get(data, 'collection.stats.total_volume'),
                hourly: get(data, 'collection.stats.one_hour_volume'),
                daily: get(data, 'collection.stats.one_day_volume'),
                weekly: get(data, 'collection.stats.seven_day_volume'),
                monthly: get(data, 'collection.stats.thirty_day_volume'),
            },
            sales: {
                total: get(data, 'collection.stats.total_sales'),
                hourly: get(data, 'collection.stats.one_hour_sales'),
                daily: get(data, 'collection.stats.one_day_sales'),
                weekly: get(data, 'collection.stats.seven_day_sales'),
                monthly: get(data, 'collection.stats.thirty_day_sales'),
            },
            price: {
                hourly: get(data, 'collection.stats.one_hour_average_price'),
                daily: get(data, 'collection.stats.one_day_average_price'),
                weekly: get(data, 'collection.stats.seven_day_average_price'),
                monthly: get(data, 'collection.stats.thirty_day_average_price'),
            },
            supply: get(data, 'collection.stats.total_supply'),
            floorPrice: get(data, 'collection.stats.floor_price'),
            netGrossEarning: get(data, 'collection.stats.total_volume'),
        };
        // ttl is in milliseconds
        await this.cacheManager.set(url, JSON.stringify(rs), 60 * 1000);
        return rs;
    }

    // as very similar to `/api/v1/collection/${slug}`,
    // this function could be replaced
    async getCollectionStat(slug: string): Promise<CollectionStatData> {
        const endpoint = join('/api/v1/collection', slug, '/stats');
        const url = new URL(endpoint, openseaConfig.url).toString();
        const headers = {
            'X-API-KEY': openseaConfig.apiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'Vibe platform',
        };

        const data = await this.callOpenSea<any>(url, { headers });

        return {
            volume: {
                total: data.stats?.total_volume,
                hourly: data.stats?.one_hour_volume,
                daily: data.stats?.one_day_volume,
                weekly: data.stats?.seven_day_volume,
                monthly: data.stats?.thirty_day_volume,
            },
            sales: {
                total: data.stats?.total_sales,
                hourly: data.stats?.one_hour_sales,
                daily: data.stats?.one_day_sales,
                weekly: data.stats?.seven_day_sales,
                monthly: data.stats?.thirty_day_sales,
            },
            supply: data.stats?.total_supply,
            floorPrice: data.stats?.floor_price,
            netGrossEarning: data.stats?.total_volume,
        };
    }

    async getCollectionEventOld(addresContract: string = '', cursor: string = ''): Promise<SaleHistory> {
        const url = new URL('/api/v1/events', openseaConfig.url).toString();
        const headers = {
            'X-API-KEY': openseaConfig.apiKey,
            'Content-Type': 'application/json',
        };
        const params = {
            asset_contract_address: addresContract,
            cursor: cursor,
            event_type: 'successful',
        };

        const data = await this.callOpenSea<SaleHistory>(url, { headers: headers, params: params });
        return data;
    }
    
    async getCollectionEvent(params: Param): Promise<SaleHistory> {
        const url = new URL('/api/v1/events', openseaConfig.url).toString();
        const headers = {
            'X-API-KEY': openseaConfig.apiKey,
            'Content-Type': 'application/json',
        };

        params.event_type = 'successful';
        const data = await this.callOpenSea<SaleHistory>(url, { headers: headers, params: params });
        return data;
    }
}

export class Param {
    asset_contract_address?: string;
    collection_slug?: string;
    cursor?: string;
    event_type?: string;
    occurred_before?: number;
    occurred_after?: number;
}
