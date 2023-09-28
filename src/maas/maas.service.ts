import { AxiosError, AxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom } from 'rxjs';

import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MaasService {
    constructor(
        private readonly configService: ConfigService,
        private readonly httpService: HttpService,
    ) {}

    async handleLoyaltyPointsTransfer({ collectionId, tokenId, metadata }) {
        const payload: AxiosRequestConfig = {
            url: '/loyalty-points/webhook',
            method: 'POST',
            data: {
                ruleName: 'reduce-for-transfer',
                collectionId,
                tokenId,
                metadata,
            },
        };
        return this._invoke(payload);
    }

    private async _invoke(payload: AxiosRequestConfig) {
        const baseURL = await this.configService.get<string>('MAAS_DOMAIN');
        payload.baseURL = baseURL;
        const { data } = await firstValueFrom(
            this.httpService.request(payload).pipe(
                catchError((error: AxiosError) => {
                    console.error(error.response.data);
                    throw 'Unexpected error from MaaS: ' + error.response.data;
                }),
            ),
        );
        return data;
    }
}
