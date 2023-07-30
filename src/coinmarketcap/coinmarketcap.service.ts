import { AxiosError, AxiosRequestConfig } from 'axios';
import { Cache } from 'cache-manager';
import { get } from 'lodash';
import { catchError, firstValueFrom } from 'rxjs';

import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

import { coinMarketCapConfig } from '../lib/configs/coinmarketcap.config';

@Injectable()
export class CoinMarketCapService {

    private defaultHeaders = {
        'X-CMC_PRO_API_KEY': coinMarketCapConfig.apiKey,
        'Content-Type': 'application/json',
    };

    constructor(
        private readonly httpRequest: HttpService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    private async callCoinMarketCap<T>(url, params: AxiosRequestConfig): Promise<T> {
        params = Object.assign({ headers: this.defaultHeaders }, params);
        const { data } = await firstValueFrom(
            this.httpRequest.get(url, params).pipe(
                catchError((error: AxiosError) => {
                    throw new Error(`Bad response from coinmarketcap: ${error.response.status}/${error.response.statusText}/${JSON.stringify(params)}`);
                })
            )
        );
        return data;
    }

    async getPrice(symbol: string, conversion?: string): Promise<CoinMarketCapQuoteData> {
        const endpoint = `/v2/tools/price-conversion`;
        const url = new URL(endpoint, coinMarketCapConfig.url);

        const params = {
            symbol,
            amount: 1,
            convert: conversion
        };
        const cacheKey = `${endpoint}::${JSON.stringify(params)}`;
        const cache = await this.cacheManager.get(cacheKey) as string;
        if (cache) {
            try {
                // it should be a recoverable JSON string
                // but need to check if the string had been hacked
                return JSON.parse(cache);
            } catch (err) {
                throw new Error('invalid cache data');
            }
        }

        const result = await this.callCoinMarketCap<any>(url, { params });
        if (!result || Object.keys(result).length === 0) {
            return {};
        }
        const data = get(result, 'data.0.quote');
        await this.cacheManager.set(cacheKey, JSON.stringify(data), 60 * 1000);

        return data;
    }

    async getPriceInUSD(symbol: string): Promise<CoinMarketCapQuoteCoin> {
        const conversion = 'usd';
        const data = await this.getPrice(symbol, conversion);

        return {
            price: data[conversion.toUpperCase()].price
        };
    }
}

export interface CoinMarketCapQuoteData {
    [key: string]: QuoteData;
}

export interface QuoteData {
    price: number;
}

export interface CoinMarketCapQuoteCoin {
    price: number;
}
