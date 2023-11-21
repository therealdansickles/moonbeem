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
    ) {
    }

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

    async handleAdGated({ collectionId, address }) {
        const payload: AxiosRequestConfig = {
            url: '/ad-gated/webhook',
            method: 'POST',
            data: {
                collectionId,
                address,
            },
        };
        return this._invoke(payload);
    }

    async handleImageUpdate({ collectionId, tokenId }) {
        const payload: AxiosRequestConfig = {
            url: '/metadata-image-update/webhook',
            method: 'POST',
            data: {
                collectionId,
                tokenId,
            },
        };
        return this._invoke(payload);
    }

    async handleReferralUpdate({ collectionId, tokenId, referralCode }) {
        const payload: AxiosRequestConfig = {
            url: '/referral/webhook',
            method: 'POST',
            data: {
                collectionId,
                tokenId,
                referralCode,
            },
        };
        return this._invoke(payload);
    }
     
    async updateNftProperties({ collectionId, tokenId, updates }) {
        const payload: AxiosRequestConfig = {
            url: '/editable-attributes/webhook',
            method: 'POST',
            data: {
                collectionId,
                tokenId,
                updates,
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
