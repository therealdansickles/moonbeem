import { ethers } from 'ethers';
import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { RelationshipService } from '../relationship/relationship.service';
import { SessionService } from '../session/session.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { CoinQuotes } from '../sync-chain/coin/coin.dto';
import { CoinService } from '../sync-chain/coin/coin.service';
import {
    MintSaleContractService
} from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import {
    MintSaleTransactionService
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import {
    createAsset721, createCollection, createMintSaleTransaction, createTier
} from '../test-utils';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { WalletService } from './wallet.service';

export const gql = String.raw;

describe('WalletResolver', () => {
    let service: WalletService;
    let collectionService: CollectionService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let mintSaleContractService: MintSaleContractService;
    let tierService: TierService;
    let userService: UserService;
    let relationshipService: RelationshipService;
    let sessionService: SessionService;
    let app: INestApplication;
    let address: string;
    let coinService: CoinService;
    let asset721Service: Asset721Service;

    beforeAll(async () => {
        app = global.app;
        service = global.walletService;
        collectionService = global.collectionService;
        mintSaleTransactionService = global.mintSaleTransactionService;
        mintSaleContractService = global.mintSaleContractService;
        tierService = global.tierService;
        userService = global.userService;
        relationshipService = global.relationshipService;
        sessionService = global.sessionService;
        coinService = global.coinService;
        asset721Service = global.asset721Service;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('wallet', () => {
        it('should get a wallet', async () => {
            const address = faker.finance.ethereumAddress();
            await service.createWallet({ address });
            const query = gql`
                query GetWallet($address: String!) {
                    wallet(address: $address) {
                        address
                    }
                }
            `;
            const variables = { address };
            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.wallet.address).toEqual(address);
                });
        });

        it('should get a wallet by name', async () => {
            const address = faker.finance.ethereumAddress();
            const name = 'dogvibe';
            await service.createWallet({ address, name });
            const query = gql`
                query GetWallet($name: String!) {
                    wallet(name: $name) {
                        name
                        address
                    }
                }
            `;
            const variables = { name };
            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.wallet.address).toEqual(address);
                    expect(body.data.wallet.name).toEqual(name);
                });
        });

        it('should create a wallet', async () => {
            address = faker.finance.ethereumAddress();
            const user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const query = gql`
                mutation CreateWallet($input: CreateWalletInput!) {
                    createWallet(input: $input) {
                        id
                        address
                        owner {
                            email
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address,
                    ownerId: user.id,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createWallet.address).toEqual(address);
                    expect(body.data.createWallet.owner.id).toEqual(user.id);
                });
        });
    });

    describe('updateWallet', () => {
        it('should update a wallet', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            await userService.createUser({
                name,
                email,
                password,
            });
            const wallet = await service.createWallet({ address: randomWallet.address });
            const session = await sessionService.createSession(wallet.address, message, signature);

            const query = gql`
                mutation UpdateWallet($input: UpdateWalletInput!) {
                    updateWallet(input: $input) {
                        address
                        name
                    }
                }
            `;

            const variables = {
                input: {
                    id: wallet.id,
                    address: wallet.address,
                    name: faker.internet.userName(),
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(session.token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateWallet.name).toEqual(variables.input.name);
                });
        });

        it('should forbid if no session provided', async () => {
            const randomWallet = ethers.Wallet.createRandom();

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            await userService.createUser({
                name,
                email,
                password,
            });
            const wallet = await service.createWallet({ address: randomWallet.address });

            const query = gql`
                mutation UpdateWallet($input: UpdateWalletInput!) {
                    updateWallet(input: $input) {
                        address
                        name
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    name: faker.internet.userName(),
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors).toBeTruthy();
                    expect(body.data).toBeFalsy();
                });
        });

        it("should forbid if candidate wallet id isn't equal the one extract from token", async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            await userService.createUser({
                name,
                email,
                password,
            });
            const wallet = await service.createWallet({ address: randomWallet.address });
            const session = await sessionService.createSession(wallet.address, message, signature);

            const anotherWallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const query = gql`
                mutation UpdateWallet($input: UpdateWalletInput!) {
                    updateWallet(input: $input) {
                        address
                        name
                    }
                }
            `;

            const variables = {
                input: {
                    id: anotherWallet.id,
                    address: wallet.address,
                    name: faker.internet.userName(),
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(session.token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors).toBeTruthy();
                    expect(body.data).toBeFalsy();
                });
        });
    });

    describe('bindWallet', () => {
        it('should forbid if not signed in', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            const owner = await userService.createUser({
                name,
                email,
                password,
            });
            const wallet = await service.createWallet({ address: randomWallet.address });

            const query = gql`
                mutation BindWallet($input: BindWalletInput!) {
                    bindWallet(input: $input) {
                        address
                        owner {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    owner: { id: owner.id },
                    message,
                    signature,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].extensions.code).toEqual('FORBIDDEN');
                    expect(body.data).toBeNull();
                });
        });

        it('should bind a wallet', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            const owner = await userService.createUser({
                name,
                email,
                password,
            });
            const wallet = await service.createWallet({ address: randomWallet.address });

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
                    password,
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;
            const query = gql`
                mutation BindWallet($input: BindWalletInput!) {
                    bindWallet(input: $input) {
                        address
                        owner {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    owner: { id: owner.id },
                    message,
                    signature,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.bindWallet.owner.id).toEqual(variables.input.owner.id);
                });
        });

        it('should bind a wallet even if the wallet doesnt exist', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();

            const owner = await userService.createUser({
                name,
                email,
                password,
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
                    password,
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const query = gql`
                mutation BindWallet($input: BindWalletInput!) {
                    bindWallet(input: $input) {
                        address
                        owner {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: randomWallet.address,
                    owner: { id: owner.id },
                    message,
                    signature,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.bindWallet.address).toEqual(randomWallet.address.toLowerCase());
                    expect(body.data.bindWallet.owner.id).toEqual(variables.input.owner.id);
                });
        });
    });

    describe('unbindWallet', () => {
        it('should unbind a wallet', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const owner = await userService.createUser({
                name: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await service.createWallet({ address: randomWallet.address });
            await service.bindWallet({
                address: wallet.address,
                owner: { id: owner.id },
                message,
                signature,
            });

            const query = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                    }
                }
            `;

            const input = {
                address: wallet.address,
                message,
                signature,
            };

            const result = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables: { input } })
                .then((resp) => {
                    return resp.body.data.createSession;
                });

            const authedQuery = gql`
                mutation UnbindWallet($input: UnbindWalletInput!) {
                    unbindWallet(input: $input) {
                        address
                        owner {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    owner: { id: owner.id },
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(result.token, { type: 'bearer' })
                .send({ query: authedQuery, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.unbindWallet.owner).toEqual(null);
                    // expect(body.data.unbindWallet.owner.id).not.toEqual(owner.id);
                    // expect(body.data.unbindWallet.owner.id).toEqual('00000000-0000-0000-0000-000000000000');
                });
        });
    });

    describe('relationships', () => {
        it('should return followersTotal and followingsTotal', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });
            const followingWallet1 = await service.createWallet({ address: faker.finance.ethereumAddress() });
            const followingWallet2 = await service.createWallet({ address: faker.finance.ethereumAddress() });
            const followerWallet1 = await service.createWallet({ address: faker.finance.ethereumAddress() });
            const followerWallet2 = await service.createWallet({ address: faker.finance.ethereumAddress() });
            const followerWallet3 = await service.createWallet({ address: faker.finance.ethereumAddress() });

            await relationshipService.createRelationshipByAddress({
                followingAddress: wallet.address,
                followerAddress: followerWallet1.address,
            });
            await relationshipService.createRelationshipByAddress({
                followingAddress: wallet.address,
                followerAddress: followerWallet2.address,
            });
            await relationshipService.createRelationshipByAddress({
                followingAddress: wallet.address,
                followerAddress: followerWallet3.address,
            });
            await relationshipService.createRelationshipByAddress({
                followingAddress: followingWallet1.address,
                followerAddress: wallet.address,
            });
            await relationshipService.createRelationshipByAddress({
                followingAddress: followingWallet2.address,
                followerAddress: wallet.address,
            });

            const query = gql`
                query Wallet($address: String!) {
                    wallet(address: $address) {
                        id
                        address
                        followingsTotal
                        followersTotal
                    }
                }
            `;

            const variables = {
                address: wallet.address,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.wallet.followingsTotal).toEqual(2);
                    expect(body.data.wallet.followersTotal).toEqual(3);
                });
        });
    });

    describe('minted', () => {
        it('should get minted NFTs', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await createCollection(collectionService);
            const tier = await createTier(tierService, { collection: { id: collection.id } });
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

            const query = gql`
                query MintedByWallet($address: String!) {
                    wallet(address: $address) {
                        minted {
                            totalCount
                            edges {
                                node {
                                    address
                                    txTime
                                    txHash
                                    chainId
                                    tier {
                                        name
                                        collection {
                                            name
                                        }
                                    }
                                }
                            }
                            pageInfo {
                                hasNextPage
                                hasPreviousPage
                                startCursor
                                endCursor
                            }
                        }
                    }
                }
            `;

            const variables = {
                address: wallet.address,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const result = body.data.wallet.minted;
                    expect(result.edges[0].node.address).toEqual(collection.address); // NOTE: These horrible `address` namings, which one is it???
                    expect(result.edges[0].node.txTime).toEqual(transaction.txTime);
                    expect(result.edges[0].node.txHash).toEqual(transaction.txHash);
                    expect(result.edges[0].node.chainId).toEqual(transaction.chainId);
                    expect(result.edges[0].node.tier.name).toEqual(tier.name);
                    expect(result.edges[0].node.tier.collection.name).toEqual(collection.name);
                });
        });
    });

    describe('activities', () => {
        it('should get activities by wallet address', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            const transaction = await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
                chainId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
            });

            const query = gql`
                query AddressByWallet($address: String!) {
                    wallet(address: $address) {
                        activities {
                            address
                            type
                            tokenAddress
                            tokenId
                            txTime
                            txHash
                            chainId

                            tier {
                                name

                                collection {
                                    name
                                }
                            }
                        }
                    }
                }
            `;

            const variables = {
                address: wallet.address,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const [firstMint] = body.data.wallet.activities;
                    expect(firstMint.address).toEqual(collection.address); // NOTE: These horrible `address` namings, which one is it???
                    expect(firstMint.txTime).toEqual(transaction.txTime);
                    expect(firstMint.txHash).toEqual(transaction.txHash);
                    expect(firstMint.chainId).toEqual(transaction.chainId);
                    expect(firstMint.tier.name).toEqual(tier.name);
                    expect(firstMint.tier.collection.name).toEqual(collection.name);
                });
        });
    });

    describe('getEstimatedValue', () => {
        it('should get estimated value', async () => {
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

            const sender1 = faker.finance.ethereumAddress();

            const wallet = await service.createWallet({ address: sender1 });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            const paymentToken = coin.address;

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                paymentToken,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                paymentToken,
            });

            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                royaltyReceiver: sender1,
                royaltyRate: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                derivativeRoyaltyRate: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().valueOf() / 1000),
                endTime: Math.floor(faker.date.future().valueOf() / 1000),
                price: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                tierId: tier.tierId,
                address: collection.address,
                paymentToken,
                startId: 0,
                endId: 10,
                currentId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            const query = gql`
                query GetEstimatedValueByWallet($address: String!) {
                    wallet(address: $address) {
                        id
                        address
                        estimatedValue {
                            total
                            totalUSDC
                            paymentTokenAddress
                        }
                    }
                }
            `;

            const variables = {
                address: wallet.address,
            };
            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });
            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.wallet.estimatedValue).toBeDefined();
                    expect(body.data.wallet.estimatedValue[0].total).toBe('2');
                    expect(body.data.wallet.estimatedValue[0].totalUSDC).toBe((tokenPriceUSD * 2).toString());
                });
        });
    });

    describe('createdCollections', () => {
        it('should get created collections by wallet', async () => {
            const wallet = await service.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [],
                creator: { id: wallet.id },
            });

            const query = gql`
                query CreatedCollections($address: String!) {
                    wallet(address: $address) {
                        createdCollections {
                            name
                        }
                    }
                }
            `;

            const variables = {
                address: wallet.address,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const [firstCollection] = body.data.wallet.createdCollections;
                    expect(firstCollection.name).toEqual(collection.name);
                });
        });
    });

    describe('getMonthlyCollections', () => {
        it('should get the monthly collections for given wallet', async () => {
            const sender = faker.finance.ethereumAddress();
            const wallet = await service.createWallet({ address: sender });

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.company.name(),
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
                creator: { id: wallet.id },
            });

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.company.name(),
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
                creator: { id: wallet.id },
            });

            const query = gql`
                query GetMonthlyCollections($address: String!) {
                    wallet(address: $address) {
                        monthlyCollections
                    }
                }
            `;

            const variables = { address: wallet.address };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.wallet).toBeDefined();
                    expect(body.data.wallet.monthlyCollections).toBe(2);
                });
        });
    });

    describe('getMonthlyBuyers', () => {
        it('should return the monthly buyers for given wallet', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(new Date().valueOf() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(new Date().valueOf() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const query = gql`
                query wallet($address: String!) {
                    wallet(address: $address) {
                        id
                        monthlyBuyers
                    }
                }
            `;
            const variables = { address: wallet.address };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.wallet).toBeDefined();
                    expect(body.data.wallet.monthlyBuyers).toBe(2);
                });
        });
    });
});
