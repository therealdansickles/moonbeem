import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { Tier } from './tier.entity';
import { TierModule } from './tier.module';
import { TierService } from './tier.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { Collection } from '../collection/collection.dto';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import BigNumber from 'bignumber.js';

export const gql = String.raw;

describe('TierResolver', () => {
    let app: INestApplication;
    let repository: Repository<Tier>;
    let service: TierService;
    let collection: Collection;
    let collectionService: CollectionService;
    let coinService: CoinService;
    let coin: Coin;
    let mintSaleTransactionService: MintSaleTransactionService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                TierModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [TierModule],
                }),
            ],
        }).compile();

        repository = module.get('TierRepository');
        service = module.get<TierService>(TierService);
        collectionService = module.get<CollectionService>(CollectionService);
        coinService = module.get<CoinService>(CoinService);
        mintSaleTransactionService = module.get<MintSaleTransactionService>(MintSaleTransactionService);

        coin = await coinService.createCoin({
            address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            derivedETH: 1,
            derivedUSDC: 1,
            enabled: true,
            chainId: 1,
        });

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('tier', () => {
        it('should return a tier', async () => {
            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await service.createTier({
                name: faker.company.name(),
                collection: { id: collection.id },
                totalMints: 10,
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const query = gql`
                query GetTier($id: String!) {
                    tier(id: $id) {
                        id
                        name
                        coin {
                            address
                        }
                        profit {
                            inPaymentToken
                            inUSDC
                        }
                    }
                }
            `;

            const variables = {
                id: tier.id,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.tier.id).toBe(tier.id);
                    expect(body.data.tier.name).toBe(tier.name);
                    expect(body.data.tier.coin).toBeDefined();
                    expect(body.data.tier.coin.address).toEqual(coin.address);
                    expect(body.data.tier.profit).toBeDefined();
                    expect(body.data.tier.profit.inPaymentToken).toEqual('0');
                });
        });

        it('should return a tier with profit', async () => {
            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await service.createTier({
                name: faker.company.name(),
                collection: { id: collection.id },
                totalMints: 10,
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const transaction = await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                collectionId: collection.id,
                paymentToken: coin.address,
            });

            const query = gql`
                query GetTier($id: String!) {
                    tier(id: $id) {
                        id
                        name
                        coin {
                            address
                        }
                        profit {
                            inPaymentToken
                            inUSDC
                        }
                    }
                }
            `;

            const variables = {
                id: tier.id,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.tier.id).toBe(tier.id);
                    expect(body.data.tier.name).toBe(tier.name);
                    expect(body.data.tier.coin).toBeDefined();
                    expect(body.data.tier.coin.address).toEqual(coin.address);
                    expect(body.data.tier.profit).toBeDefined();

                    const totalProfitsInToken = new BigNumber(transaction.price)
                        .div(new BigNumber(10).pow(coin.decimals))
                        .toString();
                    expect(body.data.tier.profit.inPaymentToken).toEqual(totalProfitsInToken);
                    expect(body.data.tier.profit.inUSDC).toEqual(
                        new BigNumber(totalProfitsInToken).multipliedBy(coin.derivedUSDC).toString()
                    );
                });
        });

        it('should return a tier with plugins, attributes and conditions', async () => {
            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await service.createTier({
                name: faker.company.name(),
                collection: { id: collection.id },
                totalMints: 10,
                paymentTokenAddress: coin.address,
                tierId: 0,
                attributes: [
                    {
                        trait_type: 'Powerup',
                        value: '1000',
                    },
                ],
                conditions: [
                    {
                        trait_type: 'Ranking',
                        equal: 'Platinum',
                        update: {
                            trait_type: 'Claimble',
                            value: true,
                        },
                    },
                ],
                plugins: [
                    {
                        type: 'gituub',
                        path: 'vibexyz/vibes',
                    },
                    {
                        type: 'vibe',
                        path: 'points',
                        config: {
                            initial: 0,
                            increment: 1,
                        },
                    },
                ],
            });

            const query = gql`
                query GetTier($id: String!) {
                    tier(id: $id) {
                        id
                        name
                        coin {
                            address
                        }
                        plugins
                        attributes
                        conditions
                    }
                }
            `;

            const variables = {
                id: tier.id,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.tier.id).toBe(tier.id);
                    expect(body.data.tier.name).toBe(tier.name);
                    expect(body.data.tier.plugins).toBe(tier.plugins);
                    expect(body.data.tier.attributes).toBe(tier.attributes);
                    expect(body.data.tier.conditions).toBe(tier.conditions);
                });
        });
    });

    describe('tiers', () => {
        it('should return tiers by collection id', async () => {
            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            await service.createTier({
                name: faker.company.name(),
                collection: { id: collection.id },
                totalMints: 10,
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            await service.createTier({
                name: faker.company.name(),
                collection: { id: collection.id },
                totalMints: 10,
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const query = gql`
                query getTiersByCollection($collectionId: String!) {
                    tiers(collectionId: $collectionId) {
                        id
                        name
                        collection {
                            id
                            name
                        }
                        coin {
                            id
                        }
                    }
                }
            `;

            const variables = {
                collectionId: collection.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.tiers.length).toBe(2);
                });
        });
    });

    describe('updateTier', () => {
        it('should update a tier', async () => {
            const tier = await service.createTier({
                name: faker.company.name(),
                collection: { id: collection.id },
                totalMints: 10,
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const query = gql`
                mutation UpdateTier($input: UpdateTierInput!) {
                    updateTier(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: tier.id,
                    name: faker.company.name(),
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateTier).toBeTruthy();
                });
        });
    });

    describe('deleteTier', () => {
        it('should delete a tier', async () => {
            const tier = await service.createTier({
                name: faker.company.name(),
                collection: { id: collection.id },
                totalMints: 10,
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const query = gql`
                mutation DeleteTier($input: DeleteTierInput!) {
                    deleteTier(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: tier.id,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.deleteTier).toBeTruthy();
                });
        });
    });
});
