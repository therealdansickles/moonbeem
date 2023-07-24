import { get } from 'lodash';
import { join } from 'path';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { catchError, firstValueFrom } from 'rxjs';
import { URL } from 'url';

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { CollectionStatData } from '../collection/collection.dto';
import { openseaConfig } from '../lib/configs/opensea.config';
import { SaleHistory } from '../saleHistory/saleHistory.dto';

const opts = {
    points: 4, // 4 points
    duration: 1, // Per second
};

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

const rateLimiter = new RateLimiterMemory(opts);

@Injectable()
export class OpenseaService {
    constructor(private readonly httpRequest: HttpService) {}
    callOpenSea<T>(url, params): Promise<T> {
        return new Promise((resolve, reject) => {
            const call = () => {
                rateLimiter
                    .consume(openseaConfig.url, 1) // consume 2 points
                    .then(async () => {
                        try {
                            const { data } = await firstValueFrom(
                                this.httpRequest.get(url, params).pipe(
                                    catchError((error) => {
                                        Sentry.captureException(error);
                                        throw 'Bad response from opensea';
                                    })
                                )
                            );
                            resolve(data);
                        } catch (error) {
                            reject(error);
                        }
                    })
                    .catch((rateLimiterRes) => {
                        setTimeout(call, rateLimiterRes.msBeforeNext);
                    });
            };
            call();
        });
    }

    async getCollection(slug: string): Promise<ICollection> {
        const endpoint = join('/api/v1/collection', slug);
        const url = new URL(endpoint, openseaConfig.url).toString();
        const headers = {
            'X-API-KEY': openseaConfig.apiKey,
            'Content-Type': 'application/json',
            'User-Agent': 'Vibe platform',
        };

        const data = await this.callOpenSea<any>(url, { headers });

        return {
            paymentToken: {
                symbol: get(data, 'payment_tokens.0.symbol'),
                priceInUSD: get(data, 'payment_tokens.0.usd_price'),
            },
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
            price: {
                hourly: data.stats?.one_hour_average_price,
                daily: data.stats?.one_day_average_price,
                weekly: data.stats?.seven_day_average_price,
                monthly: data.stats?.thirty_day_average_price,
            },
            supply: data.stats?.total_supply,
            floorPrice: data.stats?.floor_price,
            netGrossEarning: data.stats?.total_volume,
        };
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
