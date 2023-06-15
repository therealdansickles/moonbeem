import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { Coin } from './coin.entity';
import { CoinService } from './coin.service';
import { CoinModule } from './coin.module';

export const gql = String.raw;

describe('CoinResolver', () => {
    let service: CoinService;
    let app: INestApplication;
    let coin: Coin;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                CoinModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [CoinModule],
                }),
            ],
        }).compile();

        service = module.get<CoinService>(CoinService);
        app = module.createNestApplication();

        coin = await service.createCoin({
            address: faker.finance.ethereumAddress(),
            name: 'USD Coin',
            symbol: 'USDC',
            decimals: 6,
            derivedETH: faker.random.numeric(5),
            derivedUSDC: faker.random.numeric(5),
            chainId: 1,
        });

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('coin', () => {
        it('should return coin', async () => {
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
