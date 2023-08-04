import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { CollectionService } from '../collection/collection.service';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { NftService } from './nft.service';

export const gql = String.raw;

describe('NftResolver', () => {
    let service: NftService;
    let tierService: TierService;
    let collectionService: CollectionService;
    let userService: UserService;
    let walletService: WalletService;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;

        service = global.nftService;
        userService = global.userService;
        walletService = global.walletService;
        collectionService = global.collectionService;
        tierService = global.tierService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getNft', () => {
        it('query by id should work', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
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
                tokenId: faker.string.numeric(1),
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
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
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
                tokenId: +faker.string.numeric(1),
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

    describe('getNftListByQuery', () => {
        it('query by id should work', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
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

            const tokenId1 = +faker.string.numeric(1);
            const tokenId2 = +faker.string.numeric(2);
            const tokenId3 = +faker.string.numeric(4);

            const [nft1, , nft3] = await Promise.all([
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        foo: 'bar',
                    },
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        foo: 'bar',
                    },
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId3,
                    properties: {
                        foo: 'bar',
                    },
                }),
            ]);

            const query = gql`
                query Nfts($collectionId: String, $tierId: String, $tokenIds: [Int!]) {
                    nfts(collectionId: $collectionId, tierId: $tierId, tokenIds: $tokenIds) {
                        id
                        collection {
                            id
                        }
                        properties
                        tokenId
                    }
                }
            `;

            const variables = {
                collectionId: collection.id,
                tier: tier,
                tokenIds: [nft1.tokenId, nft3.tokenId],
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    body.data.nfts.sort((a, b) => a.tokenId - b.tokenId); // Sort first, otherwise there may be an order error
                    expect(body.data.nfts.length).toEqual(2);
                    expect(body.data.nfts[0].id).toEqual(nft1.id);
                    expect(body.data.nfts[1].id).toEqual(nft3.id);
                });
        });
    });

    describe('createOrUpdateNft', () => {
        it('should work', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password:'password',
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
            const tokenQuery = gql`
                mutation CreateSessionFromEmail($input: CreateSessionFromEmailInput!) {
                    createSessionFromEmail(input: $input) {
                        token
                        user {
                            id
                            email
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    email: owner.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

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
                    tokenId: faker.string.numeric(2),
                    properties: {
                        foo: 'bar',
                    },
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createOrUpdateNft.id).toBeTruthy();
                    expect(body.data.createOrUpdateNft.collection.id).toEqual(collection.id);
                });
        });
    });
});
