import * as request from 'supertest';

import { Test, TestingModule } from '@nestjs/testing';

import { ApolloDriver } from '@nestjs/apollo';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { NftModule } from './nft.module';
import { NftService } from './nft.service';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { WalletModule } from '../wallet/wallet.module';
import { WalletService } from '../wallet/wallet.service';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

export const gql = String.raw;

describe('NftResolver', () => {
    let service: NftService;
    let tierService: TierService;
    let collectionService: CollectionService;
    let userService: UserService;
    let walletService: WalletService;
    let app: INestApplication;

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
                UserModule,
                WalletModule,
                CollectionModule,
                TierModule,
                NftModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [NftModule],
                }),
            ],
        }).compile();

        service = module.get<NftService>(NftService);
        userService = module.get<UserService>(UserService);
        walletService = module.get<WalletService>(WalletService);
        collectionService = module.get<CollectionService>(CollectionService);
        tierService = module.get<TierService>(TierService);
        app = module.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('getNft', () => {
        it('query by id should work', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'Days of holding',
                        },
                    },
                },
            });

            const nft = await service.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: faker.random.numeric(1),
                properties: {
                    foo: 'bar',
                },
            });

            const query = gql`
                query Nft($id: String!) {
                    nft(id: $id) {
                        id
                        collection {
                            id
                        }
                        properties
                    }
                }
            `;

            const variables = {
                id: nft.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.nft.id).toBeTruthy();
                    expect(body.data.nft.collection.id).toEqual(collection.id);
                    expect(body.data.nft.properties.foo).toEqual('bar');
                });
        });

        it('query by criteria should work', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'Days of holding',
                        },
                    },
                },
            });

            const nft = await service.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: +faker.random.numeric(1),
                properties: {
                    foo: 'baraaa',
                },
            });

            const query = gql`
                query Nft($collectionId: String!, $tierId: String, $tokenId: Int) {
                    nft(collectionId: $collectionId, tierId: $tierId, tokenId: $tokenId) {
                        id
                        collection {
                            id
                        }
                        properties
                    }
                }
            `;

            const variables = {
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: nft.tokenId,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.nft.id).toBeTruthy();
                    expect(body.data.nft.collection.id).toEqual(collection.id);
                    expect(body.data.nft.properties.foo).toEqual('baraaa');
                });
        });
    });

    describe('createOrUpdateNft', () => {
        it('should work', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                tierId: 0,
                metadata: {
                    uses: [],
                    properties: {
                        level: {
                            name: 'level',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: 'holding_days',
                            type: 'integer',
                            value: 125,
                            display_value: 'Days of holding',
                        },
                    },
                },
            });

            const query = gql`
                mutation CreateOrUpdateNft($input: CreateOrUpdateNftInput!) {
                    createOrUpdateNft(input: $input) {
                        id
                        properties
                        collection {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: +faker.random.numeric(2),
                    properties: {
                        foo: 'bar',
                    },
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createOrUpdateNft.id).toBeTruthy();
                    expect(body.data.createOrUpdateNft.collection.id).toEqual(collection.id);
                });
        });
    });
});
