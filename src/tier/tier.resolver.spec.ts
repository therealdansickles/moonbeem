import BigNumber from 'bignumber.js';
import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { Collection } from '../collection/collection.dto';
import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { TierService } from './tier.service';
import { CoinService } from '../sync-chain/coin/coin.service';

export const gql = String.raw;

describe('TierResolver', () => {
    let app: INestApplication;
    let service: TierService;
    let walletService: WalletService;
    let collectionService: CollectionService;
    let userService: UserService;

    let coinService: CoinService;
    let asset721Service: Asset721Service;
    let mintSaleTransactionService: MintSaleTransactionService;
    let mintSaleContractService: MintSaleContractService;

    beforeAll(async () => {
        app = global.app;

        service = global.tierService;
        walletService = global.walletService;
        collectionService = global.collectionService;
        userService = global.userService;
        coinService = global.coinService;
        asset721Service = global.asset721Service;
        mintSaleContractService = global.mintSaleContractService;
        mintSaleTransactionService = global.mintSaleTransactionService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('tier', () => {
        it('should return a tier', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });
            const collection = await collectionService.createCollection({
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
                metadata: {
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
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
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
                metadata: {
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

        it('should return a tier with metadata', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
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
                metadata: {},
            });

            const query = gql`
                query GetTier($id: String!) {
                    tier(id: $id) {
                        id
                        name
                        coin {
                            address
                        }
                        metadata
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
                    expect(body.data.tier.metadata).toBeDefined();
                });
        });

        it('should works with metadata field', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
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
                metadata: {
                    name: 'Token metadata',
                    uses: ['vibexyz/creator_scoring', 'vibexyz/royalty_level'],
                    type: 'object',
                    image: 'https://media.vibe.xyz/f2f407a2-011b-4aa9-b59d-5dc35fd00375',
                    image_url: 'https://media.vibe.xyz/f2f407a2-011b-4aa9-b59d-5dc35fd00375',
                    conditions: {
                        operator: 'and',
                        rules: [
                            {
                                property: 'holding_days',
                                rule: 'greater_than',
                                value: -1,
                                update: [
                                    {
                                        property: 'holding_days',
                                        action: 'increase',
                                        value: 1,
                                    },
                                ],
                            },
                            {
                                property: 'holding_days',
                                rule: 'less_than',
                                value: 999,
                                update: [
                                    {
                                        property: 'holding_days',
                                        action: 'increase',
                                        value: 1,
                                    },
                                ],
                            },
                        ],
                        trigger: [
                            {
                                type: 'schedule',
                                updatedAt: new Date().toISOString(),
                                config: {
                                    startAt: new Date().toISOString(),
                                    endAt: new Date().toISOString(),
                                    every: 1,
                                    unit: 'minutes',
                                },
                            },
                        ],
                    },
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
                    external_url: 'https://vibe.xyz',
                },
            });

            const query = gql`
                query GetTier($id: String!) {
                    tier(id: $id) {
                        id
                        name
                        metadata
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
                    expect(body.data.tier.metadata.name).toStrictEqual(tier.metadata.name);
                });
        });
    });

    describe('createTier', () => {
        it('should forbid if not signed in', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const query = gql`
                mutation CreateTier($input: CreateTierInput!) {
                    createTier(input: $input) {
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
                input: {
                    name: faker.company.name(),
                    collection: { id: collection.id },
                    totalMints: 10,
                    paymentTokenAddress: coin.address,
                    tierId: 0,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].extensions.code).toEqual('FORBIDDEN');
                    expect(body.data).toBeNull();
                });
        });

        it('should work', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
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
                    email: user.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const query = gql`
                mutation CreateTier($input: CreateTierInput!) {
                    createTier(input: $input) {
                        id
                        name
                        collection {
                            id
                        }
                        coin {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    name: faker.company.name(),
                    collection: { id: collection.id },
                    totalMints: 10,
                    paymentTokenAddress: coin.address,
                    tierId: 0,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createTier.name).toEqual(variables.input.name);
                });
        });
    });

    describe('updateTier', () => {
        it('should update a tier', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
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
                metadata: {
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
                    email: user.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

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
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateTier).toBeTruthy();
                });
        });
    });

    describe('deleteTier', () => {
        it('should delete a tier', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
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
                metadata: {
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
                    email: user.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

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
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.deleteTier).toBeTruthy();
                });
        });
    });

    describe('getHoldersOfTier', () => {
        const collectionAddress = faker.finance.ethereumAddress().toLowerCase();
        const tierName = 'Test Tier';
        let innerCollection: Collection;

        beforeEach(async () => {
            const tokenAddress = faker.finance.ethereumAddress().toLowerCase();
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

            innerCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: collectionAddress,
            });

            await service.createTier({
                name: tierName,
                totalMints: 100,
                collection: { id: innerCollection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
                    uses: ['vibexyz/creator_scoring', 'vibexyz/royalty_level'],
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
                    conditions: {
                        operator: 'and',
                        rules: [
                            {
                                property: 'holding_days',
                                rule: 'greater_than',
                                value: -1,
                                update: [
                                    {
                                        property: 'holding_days',
                                        action: 'increase',
                                        value: 1,
                                    },
                                ],
                            },
                            {
                                property: 'level',
                                rule: 'Bronze',
                                value: '',
                                update: [
                                    {
                                        property: 'level',
                                        value: 'Silver',
                                    },
                                ],
                            },
                        ],
                        trigger: [
                            {
                                type: 'schedule',
                                updatedAt: new Date().toISOString(),
                                config: {
                                    startAt: new Date().toISOString(),
                                    endAt: new Date().toISOString(),
                                    every: 1,
                                    unit: 'minutes',
                                },
                            },
                        ],
                    },
                },
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
                collectionId: innerCollection.id,
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
                                edges {
                                    cursor
                                    node {
                                        id
                                        address
                                        name
                                        avatarUrl
                                        about
                                        websiteUrl
                                        twitter
                                        instagram
                                        discord
                                        spotify
                                        quantity
                                    }
                                }
                                pageInfo {
                                    hasNextPage
                                    hasPreviousPage
                                    startCursor
                                    endCursor
                                }
                                totalCount
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
                    expect(body.data.collection.tiers[0].holders.totalCount).toEqual(2);
                    expect(body.data.collection.tiers[0].holders.edges.length).toEqual(2);
                });
        });

        it('should get attribute overview', async () => {
            const query = gql`
                query overview($collectionAddress: String!) {
                    attributeOverview(collectionAddress: $collectionAddress)
                }
            `;

            const variables = { collectionAddress: collectionAddress.toLowerCase() };
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.attributeOverview).toBeDefined();
                    expect(body.data.attributeOverview.attributes).toBeDefined();
                    expect(body.data.attributeOverview.attributes.level).toBeDefined();
                    expect(body.data.attributeOverview.attributes.level.basic).toEqual(1);

                    expect(body.data.attributeOverview.upgrades).toBeDefined();
                    expect(body.data.attributeOverview.upgrades.level).toEqual(1);

                    expect(body.data.attributeOverview.plugins).toBeDefined();
                    expect(body.data.attributeOverview.plugins['vibexyz/creator_scoring']).toEqual(1);
                });
        });
        it('should search by keyword', async () => {
            const query = gql`
                query SearchTier($input: TierSearchBarInput!) {
                    searchTierFromCollection(input: $input) {
                        edges {
                            cursor
                            node {
                                id
                                name
                            }
                        }
                        pageInfo {
                            endCursor
                        }
                        totalCount
                    }
                }
            `;

            const variables = { input: { collectionId: innerCollection.id, keyword: 'test' } };
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.searchTierFromCollection).toBeDefined();
                    expect(body.data.searchTierFromCollection.totalCount).toEqual(1);
                    expect(body.data.searchTierFromCollection.edges).toBeDefined();
                    expect(body.data.searchTierFromCollection.edges[0]).toBeDefined();
                    expect(body.data.searchTierFromCollection.edges[0].node).toBeDefined();
                    expect(body.data.searchTierFromCollection.edges[0].node.name).toBe(tierName);
                });
        });

        it('should search by properties', async () => {
            const query = gql`
                query SearchTier($input: TierSearchBarInput!) {
                    searchTierFromCollection(input: $input) {
                        edges {
                            cursor
                            node {
                                id
                                name
                            }
                        }
                        pageInfo {
                            endCursor
                        }
                        totalCount
                    }
                }
            `;

            const variables = {
                input: { collectionId: innerCollection.id, properties: [{ name: 'level', value: 'basic' }] },
            };
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.searchTierFromCollection).toBeDefined();
                    expect(body.data.searchTierFromCollection.totalCount).toEqual(1);
                    expect(body.data.searchTierFromCollection.edges).toBeDefined();
                    expect(body.data.searchTierFromCollection.edges[0]).toBeDefined();
                    expect(body.data.searchTierFromCollection.edges[0].node).toBeDefined();
                    expect(body.data.searchTierFromCollection.edges[0].node.name).toBe(tierName);
                });
        });
    });
});
