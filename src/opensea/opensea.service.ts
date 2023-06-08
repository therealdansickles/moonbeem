import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { join } from 'path';
import { URL } from 'url';
import * as Sentry from '@sentry/node';
import { firstValueFrom, catchError } from 'rxjs';
import { openseaConfig } from '../lib/configs/opensea.config';
import { CollectionStatData } from '../collection/collection.dto';

@Injectable()
export class OpenseaService {
    constructor(private readonly httpRequest: HttpService) {}

    async getCollectionStat(slug: string): Promise<CollectionStatData> {
        const endpoint = join('/api/v1/collection', slug, '/stats');
        const url = new URL(endpoint, openseaConfig.url).toString();
        const headers = {
            'X-API-KEY': openseaConfig.apiKey,
            'User-Agent': 'Vibe platform',
        };
        const { data } = await firstValueFrom(
            this.httpRequest.get(url, { headers }).pipe(
                catchError((error) => {
                    Sentry.captureException(error);
                    throw 'Bad response from opensea';
                })
            )
        );
        return {
            volume: {
                total: data.stats?.total_volume,
                hourly: data.stats?.one_hour_volume,
                daily: data.stats?.one_day_volume,
                weekly: data.stats?.seven_day_sales,
            },
            sales: {
                total: data.stats?.total_sales,
                hourly: data.stats?.one_hour_sales,
                daily: data.stats?.one_day_sales,
                weekly: data.stats?.seven_day_sales,
            },
            supply: data.stats?.total_supply,
            floorPrice: data.stats?.floor_price,
        };
    }
}
