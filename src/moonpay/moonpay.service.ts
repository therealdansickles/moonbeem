import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { MoonpayUrl } from './moonpay.dto';

@Injectable()
export class MoonpayService {
    /**
     * generateMoonpayUrlWithSignature creates a moonpay url with the signature.
     * @param currencyCode need to be a valid asset, will be passed to moonpay via query param .
     * @param walletAddress  a valid address for the currency, will be passed to moonpay as query param.
     * @returns the url with the signature created of the secret key.
     */
    generateMoonpayUrlWithSignature(currencyCode: string, walletAddress: string): MoonpayUrl {
        if (!process.env.MOONPAY_PK) {
            throw new Error('MOONPAY_PK is needed by wasnt provided');
        }

        if (!process.env.MOONPAY_URL) {
            throw new Error('MOONPAY_URL is needed by wasnt provided');
        }

        if (!process.env.MOONPAY_SK) {
            throw new Error('MOONPAY_SK is needed by wasnt provided');
        }

        const originalUrl = `${process.env.MOONPAY_URL}?apiKey=${process.env.MOONPAY_PK}&currencyCode=${currencyCode}&walletAddress=${walletAddress}`;
        const signature = crypto
            .createHmac('sha256', process.env.MOONPAY_SK)
            .update(new URL(originalUrl).search)
            .digest('base64');

        const urlWithSignature = `${originalUrl}&signature=${encodeURIComponent(signature)}`;
        return { url: urlWithSignature } as MoonpayUrl;
    }
}
