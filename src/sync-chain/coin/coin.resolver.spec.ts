import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { CoinService } from './coin.service';

export const gql = String.raw;

describe('CoinResolver', () => {
    let service: CoinService;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.coinService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('coin', () => {
        it('should return coin', async () => {
            const coin = await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                native: false,
                enable: true,
                derivedETH: faker.string.numeric(5),
                derivedUSDC: faker.string.numeric(5),
            });

            const query = gql`
                query GetCoin($id: String!) {
                    coin(id: $id) {
                        id
                        chainId
                    }
                }
            `;

            const variables = {
                id: coin.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.coin.id).toEqual(coin.id);
                });
        });

        it('should return coin list', async () => {
            await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                chainId: 1,
                native: false,
                enable: true,
                derivedETH: faker.string.numeric(5),
                derivedUSDC: faker.string.numeric(5),
            });

            const query = gql`
                query GetCoins($chainId: Int!) {
                    coins(chainId: $chainId) {
                        id
                        chainId
                    }
                }
            `;

            const variables = {
                chainId: 1,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.coins.length).toBe(1);
                });
        });
    });
});
