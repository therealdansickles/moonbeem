import * as request from 'supertest';
import { ethers } from 'ethers';

export const gql = String.raw;

describe('MoonpayResolver', () => {
    let app: any;

    beforeAll(async () => {
        app = global.app;
    });

    beforeEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getMoonpaySignature', () => {
        it('should return a MoonpayUrl with a valid signature', async () => {
            const query = gql`
                query GetMoonpaySignature(
                    $currency: String!
                    $address: String!
                    $signature: String!
                    $message: String!
                    $theme: String!
                ) {
                    getMoonpaySignature(
                        currency: $currency
                        address: $address
                        signature: $signature
                        message: $message
                        theme: $theme
                    ) {
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

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body?.data?.getMoonpaySignature?.url).toBeDefined();
                });
        });
    });
});
