import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { join } from 'path';
import { URL } from 'url';
import * as Sentry from '@sentry/node';
import { firstValueFrom, catchError } from 'rxjs';
import { openseaConfig } from '../lib/configs/opensea.config'
import { CollectionStatData } from '../collection/collection.dto';

@Injectable()
export class OpenseaService {
    constructor(private readonly httpRequest: HttpService) { }

    async getCollectionStat(slug: string): Promise<CollectionStatData> {
        const endpoint = join('/api/v1/collection', slug)
        const url = new URL(endpoint, openseaConfig.url).toString()
        const headers = {
            'X-API-KEY': openseaConfig.apiKey,
            'User-Agent': 'Vibe platform'
        }
        const { data } = await firstValueFrom(
            this.httpRequest.get(url, { headers }).pipe(
                catchError((error) => {
                    Sentry.captureException(error);
                    throw 'Bad response from opensea';
                })
            )
        )
        return {
            volume: {
                total: data.total_volume,
                hourly: data.one_hour_volume,
                daily: data.one_day_volume,
                weekly: data.seven_day_sales,
            },
            sales: {
                total: data.total_sales,
                hourly: data.one_hour_sales,
                daily: data.one_day_sales,
                weekly: data.seven_day_sales,
            },
            supply: data.total_supply,
            floorPrice: data.floor_price
        }
    }
}
