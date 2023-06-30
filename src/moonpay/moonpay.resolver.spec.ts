import * as request from 'supertest';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { Test, TestingModule } from '@nestjs/testing';
import { MoonpayModule } from './moonpay.module';
import { MoonpayService } from './moonpay.service';
import { ethers } from 'ethers';

describe('MoonpayResolver', () => {
    let app: any;
    let moonPayService: MoonpayService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                MoonpayModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [],
                }),
            ],
        }).compile();
        moonPayService = module.get<MoonpayService>(MoonpayService);
        app = module.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('getMoonpaySignature', () => {
        it('should return a 400 because of bad signature sent', async () => {
            const query = `
              query GetMoonpaySignature($currency: String!, $address: String!, $signature: String!, $message: String!, $theme: String!) {
                getMoonpaySignature(currency: $currency, address: $address, signature: $signature, message: $message, theme: $theme) {
                  url
                }
              }
            `;

            const wallet = await ethers.Wallet.createRandom();
            const message = 'test';
            const signature = await wallet.signMessage(message);
            const variables = {
                currency: 'USD',
                address: `0x123asdasd`,
                theme: 'light',
                signature,
                message,
            };

            process.env.MOONPAY_URL = 'https://mocked-url.com';
            process.env.MOONPAY_PK = 'mocked-public-key';
            process.env.MOONPAY_SK = 'mocked-secret-key';

            await moonPayService.generateMoonpayUrlWithSignature(variables.currency, variables.address, 'light');

            const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables });
            expect(response.status).toBe(200);
            expect(response?.body?.errors[0].message).toEqual('signature verification failure');
        });
        it('should return a MoonpayUrl with a valid signature', async () => {
            const query = `
              query GetMoonpaySignature($currency: String!, $address: String!, $signature: String!, $message: String!, $theme: String!) {
                getMoonpaySignature(currency: $currency, address: $address, signature: $signature, message: $message, theme: $theme) {
                  url
                }
              }
            `;

            const wallet = await ethers.Wallet.createRandom();
            const message = 'test';
            const signature = await wallet.signMessage(message);
            const variables = {
                currency: 'USD',
                address: `${wallet.address}`,
                signature: signature,
                theme: 'light',
                message,
            };

            process.env.MOONPAY_URL = 'https://mocked-url.com';
            process.env.MOONPAY_PK = 'mocked-public-key';
            process.env.MOONPAY_SK = 'mocked-secret-key';

            await moonPayService.generateMoonpayUrlWithSignature(variables.currency, variables.address, 'light');

            const response = await request(app.getHttpServer()).post('/graphql').send({ query, variables });
            expect(response.status).toBe(200);
            expect(response?.body?.data?.getMoonpaySignature?.url).toBeDefined();
        });
    });
});
