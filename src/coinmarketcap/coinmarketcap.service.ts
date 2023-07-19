import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { catchError, firstValueFrom } from 'rxjs';
import * as Sentry from '@sentry/node';
import { coinMarketCapConfig } from '../lib/configs/coinmarketcap.config';
import { GraphQLError } from 'graphql';

const opts = {
    points: 4, // 4 points
    duration: 1, // Per second
};
const rateLimiter = new RateLimiterMemory(opts);

@Injectable()
export class CoinMarketCapService {
    constructor(private readonly httpRequest: HttpService) {}

    callCoinMarketCap<T>(url, params): Promise<T> {
        return new Promise((resolve, reject) => {
            const call = () => {
                rateLimiter
                    .consume(coinMarketCapConfig.url, 1)
                    .then(async () => {
                        try {
                            const { data } = await firstValueFrom(
                                this.httpRequest.get(url, params).pipe(
                                    catchError((error) => {
                                        Sentry.captureException(error);
                                        throw new GraphQLError('Bad response from CoinMarketCap', {
                                            extensions: { code: 'INTERNAL_SERVER_ERROR' },
                                        });
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

    async getPriceInUSD(symbol: string): Promise<CoinMarketCapQuoteCoin> {
        const endpoint = `/v2/tools/price-conversion`;
        const url = new URL(endpoint, coinMarketCapConfig.url);
        const headers = {
            'X-CMC_PRO_API_KEY': coinMarketCapConfig.apiKey,
            'Content-Type': 'application/json',
        };

        const params = {
            symbol: symbol,
            amount: 1,
            convert: 'usd',
        };

        const result = await this.callCoinMarketCap<any>(url, { headers, params });

        return {
            price: result.data[0].quote['USD'].price,
        };
    }
}

export interface CoinMarketCapQuoteCoin {
    price: number;
}
