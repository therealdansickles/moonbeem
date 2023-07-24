import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { MoonpayUrl } from './moonpay.dto';
import { ethers } from 'ethers';
import { GraphQLError } from 'graphql';
interface IGenerateMoonPaySignatureQuery {
    currency: string;
    address: string;
    theme: string;
    signature: string;
    message: string;
}

@Injectable()
export class MoonpayService {
    /**
     * generateMoonpayUrlWithSignature creates a moonpay url with the signature.
     * @param currencyCode need to be a valid asset, will be passed to moonpay via query param .
     * @param walletAddress  a valid address for the currency, will be passed to moonpay as query param.
     * @returns the url with the signature created of the secret key.
     */
    // generateMoonpayUrlWithSignature(currencyCode: string, walletAddress: string, theme: string): MoonpayUrl {
    generateMoonpayUrlWithSignature(query: IGenerateMoonPaySignatureQuery): MoonpayUrl {
        if (!process.env.MOONPAY_PK) {
            throw new Error('MOONPAY_PK is needed by wasnt provided');
        }

        if (!process.env.MOONPAY_URL) {
            throw new Error('MOONPAY_URL is needed by wasnt provided');
        }

        if (!process.env.MOONPAY_SK) {
            throw new Error('MOONPAY_SK is needed by wasnt provided');
        }

        try {
            const verifiedAddress = ethers.verifyMessage(query.message, query.signature);
            if (query.address.toLowerCase() !== verifiedAddress.toLocaleLowerCase()) {
                throw new GraphQLError('signature verification failure', {
                    extensions: { code: 'BAD_REQUEST' },
                });
            }

            const originalUrl = `${process.env.MOONPAY_URL}?apiKey=${process.env.MOONPAY_PK}&currencyCode=${query.currency}&walletAddress=${query.address}&theme=${query.theme}`;
            const signature = crypto
                .createHmac('sha256', process.env.MOONPAY_SK)
                .update(new URL(originalUrl).search)
                .digest('base64');

            const urlWithSignature = `${originalUrl}&signature=${encodeURIComponent(signature)}`;
            return { url: urlWithSignature } as MoonpayUrl;
        } catch (error) {
            throw new GraphQLError('signature verification failure', {
                extensions: { code: 'BAD_REQUEST' },
            });
        }
    }
}
