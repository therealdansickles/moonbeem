import BigNumber from 'bignumber.js';
import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { CollectionService } from '../collection/collection.service';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { NftService } from './nft.service';
import { createAsset721, createCollection, createMintSaleTransaction, createPlugin, createTier } from '../test-utils';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Repository } from 'typeorm';
import { Plugin } from '../plugin/plugin.entity';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';

export const gql = String.raw;

describe('NftResolver', () => {
    let service: NftService;
    let tierService: TierService;
    let collectionService: CollectionService;
    let userService: UserService;
    let walletService: WalletService;
    let app: INestApplication;
    let mintSaleTransactionService: MintSaleTransactionService;
    let asset721Service: Asset721Service;
    let collectionPluginService: CollectionPluginService;
    let pluginRepository: Repository<Plugin>;

    beforeAll(async () => {
        app = global.app;

        service = global.nftService;
        userService = global.userService;
        walletService = global.walletService;
        collectionService = global.collectionService;
        tierService = global.tierService;
        mintSaleTransactionService = global.mintSaleTransactionService;
        asset721Service = global.asset721Service;
        collectionPluginService = global.collectionPluginService;
        pluginRepository = global.pluginRepository;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getNft', () => {
        it('query by tokenId should work', async () => {
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
                tokenId: faker.string.numeric({ length: 1, allowLeadingZeros: false }),
                properties: {
                    foo: { value: 'bar' },
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
                    expect(body.data.nft.properties.foo.value).toEqual('bar');
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
                tokenId: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                properties: {
                    foo: { value: 'baraaa' },
                },
            });

            const query = gql`
                query Nft($collectionId: String!, $tierId: String, $tokenId: String) {
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
                    expect(body.data.nft.properties.foo.value).toEqual('baraaa');
                });
        });
    });

    describe('getNftListByQuery', () => {
        it('query by tokenIds should work', async () => {
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

            const anotherCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const anotherTier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: anotherCollection.id },
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

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 3, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 4, allowLeadingZeros: false });

            const [nft1, , nft3] = await Promise.all([
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        foo: { value: 'bar' },
                    },
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        foo: { value: 'bar' },
                    },
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: anotherCollection.id,
                    tierId: anotherTier.id,
                    tokenId: tokenId3,
                    properties: {
                        foo: { value: 'bar' },
                    },
                }),
            ]);

            const query = gql`
                query Nfts($collectionId: String, $tierId: String, $tokenIds: [String!]) {
                    nfts(collectionId: $collectionId, tierId: $tierId, tokenIds: $tokenIds) {
                        id
                        collection {
                            id
                            creator {
                                id
                            }
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
                    expect(body.data.nfts.length).toEqual(1);
                    expect(body.data.nfts[0].id).toEqual(nft1.id);

                    expect(body.data.nfts[0].collection).toBeDefined();
                    expect(body.data.nfts[0].collection.creator).toBeDefined();
                    expect(body.data.nfts[0].collection.creator.id).toBe(wallet.id);
                });
        });
    });

    describe('getNftsByProperty', () => {
        it('query by collection and propertyName should work', async () => {
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
                            name: '{{level}}',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: '{{holding_days}}',
                            type: 'number',
                            value: '125',
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 4, allowLeadingZeros: false });
            const tokenId4 = faker.string.numeric({ length: 5, allowLeadingZeros: false });

            const [nft1, , nft3] = await Promise.all([
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        foo: {
                            name: '{{foo}}',
                            value: '9',
                        },
                    },
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        bar: {
                            name: '{{bar}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                    },
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId3,
                    properties: {
                        foo: {
                            name: '{{foo}}',
                            value: '100',
                        },
                        bar: {
                            name: '{{bar}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                    },
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId4,
                    properties: {},
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: faker.string.uuid(),
                    tierId: tier.id,
                    tokenId: tokenId4,
                    properties: {},
                }),
            ]);

            const query = gql`
                query NftsByProperty($collectionId: String!, $propertyName: String!) {
                    nftsByProperty(collectionId: $collectionId, propertyName: $propertyName) {
                        id
                        collection {
                            id
                        }
                        tier {
                            id
                            name
                        }
                        properties
                        tokenId
                    }
                }
            `;

            const variables = {
                collectionId: collection.id,
                propertyName: 'foo',
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const nfts = body.data.nftsByProperty;
                    expect(nfts[0].tokenId).toEqual(nft3.tokenId);
                    expect(nfts[1].tokenId).toEqual(nft1.tokenId);
                });
        });
    });

    describe('getOverviewByCollectionAndProperty', () => {
        it('query by collection and propertyName should work', async () => {
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
                            name: '{{level}}',
                            type: 'string',
                            value: 'basic',
                            display_value: 'Basic',
                        },
                        holding_days: {
                            name: '{{holding_days}}',
                            type: 'number',
                            value: '125',
                            display_value: 'none',
                        },
                    },
                },
            });

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 4, allowLeadingZeros: false });
            const tokenId4 = faker.string.numeric({ length: 5, allowLeadingZeros: false });

            const [nft1, , nft3] = await Promise.all([
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId1,
                    properties: {
                        foo: {
                            name: '{{foo}}',
                            value: faker.string.numeric({ length: 4, allowLeadingZeros: false }),
                        },
                    },
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId2,
                    properties: {
                        bar: {
                            name: '{{bar}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                    },
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId3,
                    properties: {
                        foo: {
                            name: '{{foo}}',
                            value: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                        },
                        bar: {
                            name: '{{bar}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                    },
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: collection.id,
                    tierId: tier.id,
                    tokenId: tokenId4,
                    properties: {},
                }),
                service.createOrUpdateNftByTokenId({
                    collectionId: faker.string.uuid(),
                    tierId: tier.id,
                    tokenId: tokenId4,
                    properties: {
                        foo: {
                            name: '{{foo}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                        bar: {
                            name: '{{bar}}',
                            value: faker.string.numeric({ allowLeadingZeros: false }),
                        },
                    },
                }),
            ]);

            const query = gql`
                query NftPropertyOverview($collectionId: String!, $propertyName: String!) {
                    nftPropertyOverview(collectionId: $collectionId, propertyName: $propertyName) {
                        min
                        max
                        avg
                    }
                }
            `;

            const variables = {
                collectionId: collection.id,
                propertyName: 'foo',
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const { max, min, avg } = body.data.nftPropertyOverview;
                    expect(max).toEqual(nft1.properties.foo.value);
                    expect(min).toEqual(nft3.properties.foo.value);
                    expect(avg).toEqual(
                        BigNumber(nft1.properties.foo.value).plus(nft3.properties.foo.value).dividedBy(2).toFixed(
                            2).toString());
                });
        });
    });

    describe('createOrUpdateNft', () => {
        it('should work', async () => {
            const owner = await userService.createUser({
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

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send(
                { query: tokenQuery, variables: tokenVariables });

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
                    tokenId: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
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

    describe('resolve pluginsInstalled field', function () {
        it('should resolve pluginsInstalled field', async () => {
            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await createCollection(collectionService, {
                creator: { id: wallet.id },
            });

            const tier = await createTier(tierService, {
                collection: { id: collection.id },
            });

            const nft = await service.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: faker.string.numeric({ length: 1, allowLeadingZeros: false }),
                properties: {
                    foo: { value: 'bar' },
                },
            });

            const transaction = await createMintSaleTransaction(mintSaleTransactionService, {
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
            });
            await createAsset721(asset721Service, {
                address: transaction.tokenAddress,
                tokenId: transaction.tokenId,
                owner: wallet.address,
            });
            const plugin = await createPlugin(pluginRepository);

            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.company.name(),
                description: faker.lorem.paragraph(),
                mediaUrl: faker.image.url(),
                pluginDetail: {
                    collectionAddress: collection.address,
                    tokenAddress: collection.tokenAddress,
                },
            };
            await collectionPluginService.createCollectionPlugin(input);

            const query = gql`
                query Nft($id: String!) {
                    nft(id: $id) {
                        id
                        collection {
                            id
                        }
                        properties
                        pluginsInstalled {
                            name
                            collectionAddress
                            tokenAddress
                            pluginName
                            claimed
                            description
                            mediaUrl
                        }
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
                    expect(body.data.nft.properties.foo.value).toEqual('bar');
                    expect(body.data.nft.pluginsInstalled).toEqual([{
                        name: input.name,
                        collectionAddress: collection.address,
                        tokenAddress: collection.tokenAddress,
                        pluginName: plugin.name,
                        description: input.description,
                        mediaUrl: input.mediaUrl,
                        claimed: false,
                    }]);
                });
        });
    });
});
