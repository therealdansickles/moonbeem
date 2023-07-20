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
        it.skip('should return coin', async () => {
            const coin = await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
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

            const uuid = faker.datatype.uuid();
            const mockResponse = {
                id: uuid,
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                native: false,
                enable: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            jest.spyOn(service, 'getCoin').mockImplementation(async () => mockResponse);

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.coin.id).toEqual(uuid);
                });
        });

        it.skip('should return coin list', async () => {
            await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
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
            const address = faker.finance.ethereumAddress();
            const mockResponse = [
                {
                    id: faker.datatype.uuid(),
                    address: address,
                    name: 'USD Coin',
                    symbol: 'USDC',
                    decimals: 6,
                    native: false,
                    enable: true,
                    chainId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            jest.spyOn(service, 'getCoins').mockImplementation(async () => mockResponse);

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.coins.length).toBeGreaterThan(0);
                });
        });
    });
});
