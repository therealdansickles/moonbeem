import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { Collection } from '../collection/collection.dto';
import { CollectionService } from '../collection/collection.service';
import { OrganizationService } from '../organization/organization.service';
import { Coin, CoinQuotes } from '../sync-chain/coin/coin.dto';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { User } from '../user/user.dto';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { getToken } from '../test-utils';

export const gql = String.raw;

describe('UserResolver', () => {
    let service: UserService;
    let app: INestApplication;
    let basicUser: User;
    let coinService: CoinService;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;
    let walletService: WalletService;
    let mintSaleTransactionService: MintSaleTransactionService;

    beforeAll(async () => {
        app = global.app;
        service = global.userService;
        coinService = global.coinService;
        organizationService = global.organizationService;
        collectionService = global.collectionService;
        walletService = global.walletService;
        mintSaleTransactionService = global.mintSaleTransactionService;

        jest.spyOn(global.mailService, 'sendWelcomeEmail').mockImplementation(async () => {});
        jest.spyOn(global.mailService, 'sendInviteEmail').mockImplementation(async () => {});

        basicUser = await service.createUser({
            email: faker.internet.email(),
            password: 'password',
        });
    });

    afterAll(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getUser', () => {
        it('should get an user', async () => {
            const query = gql`
                query GetUser($id: String!) {
                    user(id: $id) {
                        id
                        email
                        avatarUrl
                        backgroundUrl
                        websiteUrl
                        twitter
                        instagram
                        discord

                        wallets {
                            id
                        }

                        organizations {
                            id
                        }

                        memberships {
                            id
                        }
                    }
                }
            `;

            const variables = { id: basicUser.id };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.user.id).toEqual(basicUser.id);
                    expect(body.data.user.email).toEqual(basicUser.email);
                    expect(body.data.user.avatarUrl).toBeDefined();
                    expect(body.data.user.avatarUrl).toBeDefined();
                    expect(body.data.user.backgroundUrl).toBeDefined();
                    expect(body.data.user.websiteUrl).toBeDefined();
                    expect(body.data.user.twitter).toBeDefined();
                    expect(body.data.user.instagram).toBeDefined();
                    expect(body.data.user.discord).toBeDefined();
                    expect(body.data.user.wallets).toBeDefined();
                    expect(body.data.user.organizations).toBeDefined();
                    expect(body.data.user.memberships).toBeDefined();
                });
        });
    });

    describe('createUser', () => {
        it('should create an user', async () => {
            const query = gql`
                mutation CreateUser($input: CreateUserInput!) {
                    createUser(input: $input) {
                        id
                        email
                        username
                        avatarUrl
                    }
                }
            `;

            const variables = {
                input: {
                    username: faker.internet.userName(),
                    email: faker.internet.email(),
                    avatarUrl: faker.internet.avatar(),
                    password: 'password',
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createUser.id).toBeDefined();
                    expect(body.data.createUser.email).toEqual(variables.input.email.toLowerCase());
                    expect(body.data.createUser.username).toEqual(variables.input.username);
                    expect(body.data.createUser.avatarUrl).toEqual(variables.input.avatarUrl);
                });
        });

        it('should throw an error if email is not valid', async () => {
            const query = gql`
                mutation CreateUser($input: CreateUserInput!) {
                    createUser(input: $input) {
                        id
                        email
                        username
                        avatarUrl
                    }
                }
            `;

            const variables = {
                input: {
                    username: faker.internet.userName(),
                    email: faker.company.name(),
                    avatarUrl: faker.internet.avatar(),
                    password: 'password',
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors).toBeDefined();
                    expect(body.errors.length).toBe(1);
                    expect(body.errors[0].message).toBe('Bad Request Exception');
                    expect(body.errors[0].extensions.response.message).toBeDefined();
                    expect(body.errors[0].extensions.response.message.length).toBe(1);
                    expect(body.errors[0].extensions.response.message[0]).toBe('Invalid email address format for the email field.');
                });
        });
    });

    describe('updateUser', () => {
        it('should update an user', async () => {
            const user = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
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

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;
            const query = gql`
                mutation updateUser($input: UpdateUserInput!) {
                    updateUser(input: $input) {
                        id
                        email
                        username
                        avatarUrl
                    }
                }
            `;

            const variables = {
                input: {
                    id: user.id,
                    username: faker.internet.userName(),
                    email: faker.internet.email(),
                    avatarUrl: faker.internet.avatar(),
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateUser.id).toEqual(user.id);
                    expect(body.data.updateUser.email).toEqual(variables.input.email);
                    expect(body.data.updateUser.username).toEqual(variables.input.username);
                    expect(body.data.updateUser.avatarUrl).toEqual(variables.input.avatarUrl);
                });
        });
    });

    describe('verifyUser', () => {
        it('should verify an user', async () => {
            basicUser = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const query = gql`
                mutation verifyUser($input: VerifyUserInput!) {
                    verifyUser(input: $input) {
                        id
                        email
                        username
                        avatarUrl
                    }
                }
            `;

            const variables = {
                input: {
                    email: basicUser.email,
                    verificationToken: basicUser.verificationToken,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.verifyUser.id).toEqual(basicUser.id);
                    expect(body.data.verifyUser.email).toEqual(variables.input.email);
                });
        });
    });

    describe('sendPasswordResetLink', () => {
        it('send the reset link successfully', async () => {
            basicUser = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const query = gql`
                mutation sendPasswordResetLink($input: PasswordResetLinkInput!) {
                    sendPasswordResetLink(input: $input)
                }
            `;

            const variables = {
                input: {
                    email: basicUser.email,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.sendPasswordResetLink).toEqual(true);
                });
        });
    });

    describe('resetPassword', () => {
        it('reset the password successfully', async () => {
            basicUser = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const query = gql`
                mutation resetPassword($input: ResetPasswordInput!) {
                    resetPassword(input: $input) {
                        code
                    }
                }
            `;

            const variables = {
                input: {
                    email: basicUser.email,
                    verificationToken: basicUser.verificationToken,
                    password: 'new_password',
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.resetPassword.code).toEqual('SUCCESS');
                });
        });
    });

    describe('getUserProfit', () => {
        let owner: User;
        let collection: Collection;
        let coin: Coin;
        beforeEach(async () => {
            owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
            });
            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

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
        });

        it('should return empty array, if nobody mints', async () => {
            const query = gql`
                query User($id: String) {
                    user(id: $id) {
                        id
                        name
                        username
                        totalCollections
                        profit {
                            inUSDC
                            inPaymentToken
                        }
                    }
                }
            `;
            const variables = {
                id: owner.id,
            };
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.user.profit.length).toBe(0);
                });
        });

        it("should calculate the user's profit", async () => {
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: coin.address,
            });

            jest.spyOn(coinService, 'getQuote').mockImplementation(async () => {
                return { USD: { price: 1.23456 } };
            });

            const query = gql`
                query User($id: String) {
                    user(id: $id) {
                        id
                        name
                        username
                        profit {
                            inUSDC
                            inPaymentToken
                        }
                    }
                }
            `;
            const variables = {
                id: owner.id,
            };

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.user.profit.length).toBe(1);
                    expect(body.data.user.profit[0].inPaymentToken).toBe('1');
                    expect(body.data.user.profit[0].inUSDC).toBe(tokenPriceUSD.toString());
                });
        });

        describe('getTotalCollections', () => {
            it('should be return total collection by creator.', async () => {
                const owner = await service.createUser({
                    email: faker.internet.email(),
                    password: 'password',
                });
                const wallet = await walletService.createWallet({
                    address: faker.finance.ethereumAddress(),
                    ownerId: owner.id,
                });
                const organization = await organizationService.createOrganization({
                    name: faker.company.name(),
                    displayName: faker.company.name(),
                    about: faker.company.catchPhrase(),
                    avatarUrl: faker.image.url(),
                    backgroundUrl: faker.image.url(),
                    websiteUrl: faker.internet.url(),
                    twitter: faker.internet.userName(),
                    instagram: faker.internet.userName(),
                    discord: faker.internet.userName(),
                    owner: owner,
                });

                await collectionService.createCollection({
                    name: faker.company.name(),
                    displayName: 'The best collection',
                    about: 'The best collection ever',
                    address: faker.finance.ethereumAddress(),
                    artists: [],
                    tags: [],
                    organization: organization,
                    creator: { id: wallet.id },
                });

                const query = gql`
                    query User($id: String) {
                        user(id: $id) {
                            id
                            name
                            username
                            totalCollections
                        }
                    }
                `;
                const variables = {
                    id: owner.id,
                };
                return await request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query, variables })
                    .expect(200)
                    .expect(({ body }) => {
                        expect(body.data.user.totalCollections).toBe(1);
                    });
            });
        });
    });

    describe('getUniqueBuyers', () => {
        it('should return the unique buyers.', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
            });
            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const recipient1 = faker.finance.ethereumAddress();
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });
            // same recipient, should be 1
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const query = gql`
                query User($id: String) {
                    user(id: $id) {
                        id
                        uniqueBuyers
                    }
                }
            `;

            const variables = {
                id: owner.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.user.uniqueBuyers).toBe(1);
                });
        });
    });

    describe('getItemSold', () => {
        it('should return number of sales for all collections created by the user', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
            });
            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            // Records that do not match current collection
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const query = gql`
                query User($id: String) {
                    user(id: $id) {
                        id
                        name
                        itemSold
                    }
                }
            `;
            const variables = {
                id: owner.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.user.itemSold).toBe(1);
                });
        });
    });

    describe('getLatestSales', () => {
        it('should return list for all collections latest sales created by the user', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
            });
            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
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

            const recipient1 = faker.finance.ethereumAddress();
            const txHash = faker.string.hexadecimal({ length: 66, casing: 'lower' });
            const txTime = Math.floor(faker.date.recent().getTime() / 1000);
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash,
                txTime: txTime,
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: coin.address,
            });

            // Records that do not match current collection
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash,
                txTime: txTime,
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: coin.address,
            });

            const query = gql`
                query User($id: String) {
                    user(id: $id) {
                        id
                        name
                        username
                        totalCollections
                        profit {
                            inUSDC
                            inPaymentToken
                        }
                        latestSales {
                            edges {
                                cursor
                                node {
                                    txTime
                                    txHash
                                    quantity
                                    totalPrice {
                                        inUSDC
                                        inPaymentToken
                                    }
                                    recipient
                                    tier {
                                        name
                                    }
                                    collection {
                                        id
                                        name
                                    }
                                }
                            }
                            pageInfo {
                                hasNextPage
                                hasPreviousPage
                            }
                            totalCount
                        }
                    }
                }
            `;
            const variables = {
                id: owner.id,
            };

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.user.latestSales.edges.length).toBe(1);
                    expect(body.data.user.latestSales.totalCount).toBe(1);
                    expect(body.data.user.latestSales.edges[0].node).toBeDefined();
                    expect(body.data.user.latestSales.edges[0].node.quantity).toBe(2);
                    expect(body.data.user.latestSales.edges[0].node.recipient).toBe(recipient1);
                    expect(body.data.user.latestSales.edges[0].node.collection.id).toBe(collection.id);
                });
        });
    });

    describe('onboardUsers', function () {
        it('should onboard user successfully', async () => {
            const tokenEmail = 'any-user@vibe.xyz';
            await service.createUser({
                email: tokenEmail,
                password: 'password',
            });
            const token = await getToken(app, tokenEmail);
            const email = faker.internet.email().toLowerCase();
            const query = gql`
                mutation OnboardUsers($input: OnboardUsersInput!) {
                    onboardUsers(input: $input) {
                        email
                    }
                }
            `;

            const variables = {
                input: {
                    emails: [email],
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.onboardUsers[0].email).toEqual(email);
                });
        });

        it('should return 403 if it is not vibe email', async () => {
            const email = faker.internet.email().toLowerCase();
            await service.createUser({
                email,
                password: 'password',
            });
            const token = await getToken(app, email);

            const query = gql`
                mutation OnboardUsers($input: OnboardUsersInput!) {
                    onboardUsers(input: $input) {
                        email
                    }
                }
            `;

            const variables = {
                input: {
                    emails: [email],
                },
            };

            /* For anyone that wants to know the error response
                {
                    "errors": [
                        {
                            "message": "Forbidden resource",
                            "extensions": {
                                "code": "FORBIDDEN",
                                "response": {
                                    "statusCode": 403,
                                    "message": "Forbidden resource",
                                    "error": "Forbidden"
                                }
                            }
                        }
                    ],
                    "data": null
                }
             */
            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].message).toEqual('Forbidden resource');
                    expect(body.errors[0].extensions.response.statusCode).toEqual(403);
                });
        });
    });

    describe('getPasswordResetLink', function () {
        it('should return password reset link', async () => {
            const email = faker.internet.email().toLowerCase();
            await service.createUser({
                email,
                password: 'password',
            });

            const token = await getToken(app, email);

            const query = gql`
                query GetResetPasswordLink {
                    getResetPasswordLink
                }
            `;

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.getResetPasswordLink).toBeDefined();
                });
        });

        it('should return 403 if no valid token', async () => {
            const query = gql`
                query GetResetPasswordLink {
                    getResetPasswordLink
                }
            `;
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].message).toEqual('Forbidden resource');
                    expect(body.errors[0].extensions.response.statusCode).toEqual(403);
                });
        });
    });

    describe('acceptPluginInvitation', function () {
        it('should accept plugin invitation', async () => {
            const inviteCode = faker.string.sample(7);
            const inviter = await service.createUser({
                email: faker.internet.email().toLowerCase(),
                password: 'password',
                pluginInviteCodes: [inviteCode],
            });

            const invitee = await service.createUser({
                email: faker.internet.email().toLowerCase(),
                password: 'password',
            });

            const token = await getToken(app, invitee.email);
            const variables = {
                pluginInviteCode: inviter.pluginInviteCodes[0],
            };

            const query = gql`
                mutation AcceptPluginInvitation($pluginInviteCode: String!) {
                    acceptPluginInvitation(pluginInviteCode: $pluginInviteCode) {
                        id
                        pluginInvited
                        pluginInviteCodes
                    }
                }
            `;

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.acceptPluginInvitation).toBeDefined();
                    const user = body.data.acceptPluginInvitation;
                    expect(user.id).toEqual(invitee.id);
                    expect(user.pluginInvited).toBeTruthy();
                    expect(user.pluginInviteCodes).toHaveLength(3);
                });
        });
    });
});
