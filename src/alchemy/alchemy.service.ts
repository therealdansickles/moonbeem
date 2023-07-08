import { Injectable } from '@nestjs/common';
import { alchemyConfig } from '../lib/configs/alchemy.config';
import { firstValueFrom, catchError } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as Sentry from '@sentry/node';
import { AxiosRequestConfig } from 'axios';
@Injectable()
export class AlchemyService {
    constructor(private readonly httpRequest: HttpService) { }

    async updateWebHook(params: ParamAlchemyUpdateWebHook): Promise<any> {
        const url = new URL('/api/update-webhook-nft-filters', alchemyConfig.url).toString();
        const config: AxiosRequestConfig = {
            headers: {
                'X-Alchemy-Token': alchemyConfig.authKey,
                'content-type': 'application/json',
                'accept': 'application/json'
            },
        };
        const { data } = await firstValueFrom(
            this.httpRequest.patch(url, params, config).pipe(
                catchError((error) => {
                    Sentry.captureException(error);
                    throw 'Bad response from alchemy ' + error;
                })
            )
        );

        return data;
    }
}



export class ParamAlchemyCreateWebHook {
    network?: string;
    webhook_type?: string;
    webhook_url?: string;
    nft_filters?: FilterNft[]
}
export class ParamAlchemyUpdateWebHook {
    webhook_id?: string;
    nft_filters_to_add?: FilterNft[];
    nft_filters_to_remove?: FilterNft[];
}
export interface Response {
    data: Data
}
export interface FilterNft {

    contract_address?: String;
    token_id?: string;

}


export interface Data {
    id: string
    network: string
    webhook_type: string
    webhook_url: string
    is_active: boolean
    time_created: number
    signing_key: string
    version: string
}