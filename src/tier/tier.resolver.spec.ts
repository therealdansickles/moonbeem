import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { TierModule } from './tier.module';
import { TierService } from './tier.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { Collection } from '../collection/collection.dto';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import BigNumber from 'bignumber.js';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { WalletService } from '../wallet/wallet.service';

export const gql = String.raw;

describe('TierResolver', () => {
    let app: INestApplication;
    let service: TierService;
    let collection: Collection;
    let walletService: WalletService;
    let collectionService: CollectionService;

    // sync_chain services
    let coin: Coin;
    let coinService: CoinService;
    let asset721Service: Asset721Service;
    let mintSaleTransactionService: MintSaleTransactionService;
    let mintSaleContractService: MintSaleContractService;

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
                    url: postgresConfig.syncChain.url,
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

        service = module.get<TierService>(TierService);
        walletService = module.get<WalletService>(WalletService);
        collectionService = module.get<CollectionService>(CollectionService);
        // sync_chain services
        coinService = module.get<CoinService>(CoinService);
        asset721Service = module.get<Asset721Service>(Asset721Service);
        mintSaleContractService = module.get<MintSaleContractService>(MintSaleContractService);
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
        global.gc && global.gc();
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
                        rules: {
                            trait_type: 'greater_than',
                            value: '10',
                        },
                        update: {
                            trait_type: 'Claimble',
                            value: 'true',
                        },
                    },
                ],
                plugins: [
                    {
                        type: 'gitub',
                        path: 'vibexyz/vibes',
                    },
                    {
                        type: 'vibe',
                        path: 'points',
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
                        attributes {
                            trait_type
                            value
                        }
                        conditions {
                            trait_type
                            rules {
                                trait_type
                                value
                            }
                            update {
                                trait_type
                                value
                            }
                        }
                        plugins {
                            type
                            path
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
                    expect(body.data.tier.plugins).toStrictEqual(tier.plugins);
                    expect(body.data.tier.attributes).toStrictEqual(tier.attributes);
                    expect(body.data.tier.conditions).toStrictEqual(tier.conditions);
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
                    price: '1024',
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

    describe('getHoldersOfTier', () => {
        const collectionAddress = faker.finance.ethereumAddress().toLowerCase();

        beforeEach(async () => {
            const tokenAddress = faker.finance.ethereumAddress().toLowerCase();
            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: collectionAddress,
            });

            await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: collectionAddress,
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: tokenAddress,
                collectionId: collection.id,
            });
            const owner1 = faker.finance.ethereumAddress().toLowerCase();
            await walletService.createWallet({ address: owner1 });
            const tokenId1 = faker.random.numeric(5);

            const owner2 = faker.finance.ethereumAddress().toLowerCase();
            await walletService.createWallet({ address: owner2 });
            const tokenId2 = faker.random.numeric(5);

            await asset721Service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId1,
                owner: owner1,
            });
            await asset721Service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId2,
                owner: owner2,
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 0,
                tokenAddress: tokenAddress,
                tokenId: tokenId1,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 0,
                tokenAddress: tokenAddress,
                tokenId: tokenId2,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });
        });

        it('should get holders of tier', async () => {
            const query = gql`
                query GetTierHolder($address: String) {
                    collection(address: $address) {
                        tiers {
                            id
                            name
                            holders {
                                total
                                data {
                                    id
                                    transaction {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const variables = { address: collectionAddress };
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.tiers).toBeDefined();
                    expect(body.data.collection.tiers.length).toEqual(1);
                    expect(body.data.collection.tiers[0].holders.total).toEqual(2);
                    expect(body.data.collection.tiers[0].holders.data.length).toEqual(2);
                });
        });
    });
});
