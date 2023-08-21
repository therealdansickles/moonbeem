import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { CollaborationService } from '../collaboration/collaboration.service';
import { OrganizationService } from '../organization/organization.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import {
    MintSaleContractService
} from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import {
    MintSaleTransactionService
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import {
    createCoin,
    createCollection,
    createMemberships,
    createMintSaleContract,
    createMintSaleTransaction,
    createOrganization,
    createTier
} from '../test-utils';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { CollectionStat, CollectionStatus } from './collection.dto';
import { Collection, CollectionKind } from './collection.entity';
import { CollectionService } from './collection.service';
import { generateSlug } from './collection.utils';
import { MembershipService } from '../membership/membership.service';

export const gql = String.raw;

describe('CollectionResolver', () => {
    let service: CollectionService;
    let app: INestApplication;
    let organizationService: OrganizationService;
    let userService: UserService;
    let tierService: TierService;
    let coinService: CoinService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let mintSaleContractService: MintSaleContractService;
    let collaborationService: CollaborationService;
    let walletService: WalletService;
    let asset721Service: Asset721Service;
    let membershipService: MembershipService;

    beforeAll(async () => {
        app = global.app;

        service = global.collectionService;
        organizationService = global.organizationService;
        collaborationService = global.collaborationService;
        userService = global.userService;
        tierService = global.tierService;
        coinService = global.coinService;
        mintSaleTransactionService = global.mintSaleTransactionService;
        mintSaleContractService = global.mintSaleContractService;
        asset721Service = global.asset721Service;
        walletService = global.walletService;
        membershipService = global.membershipService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    const getToken = async (tokenVariables) => {

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

        const tokenRs = await request(app.getHttpServer())
            .post('/graphql')
            .send({ query: tokenQuery, variables: tokenVariables });

        const { token } = tokenRs.body.data.createSessionFromEmail;
        return token;
    };

    describe('collection', () => {
        const email = faker.internet.email();
        let coin;
        let owner;
        let organization;
        let collection;
        let authToken;

        beforeEach(async () => {
            coin = await createCoin(coinService);
            owner = await userService.createUser({
                email,
                password: 'password',
            });
            organization = await createOrganization(organizationService, {
                owner,
            });
            collection = await createCollection(service, {
                organization: organization,
            });
            await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });

            const tokenVariables = {
                input: {
                    email: owner.email,
                    password: 'password',
                },
            };
            authToken = await getToken(tokenVariables);
            await createMemberships(membershipService, {
                emails: [email],
                organizationId: organization.id,
            });
        });

        it('should get a collection by id', async () => {
            const query = gql`
                query GetCollection($id: String!) {
                    collection(id: $id) {
                        name
                        displayName
                        kind

                        organization {
                            name
                        }

                        collaboration {
                            id
                        }
                    }
                }
            `;

            const variables = { id: collection.id };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.name).toEqual(collection.name);
                    expect(body.data.collection.displayName).toEqual(collection.displayName);
                    expect(body.data.collection.organization.name).toEqual(organization.name);
                    expect(body.data.collection.collaboration).toBeNull();
                });
        });

        it('should get a collection by id with contract details', async () => {
            const beginTime = Math.floor(faker.date.recent().getTime() / 1000);
            const endTime = Math.floor(faker.date.recent().getTime() / 1000);

            await createMintSaleContract(mintSaleContractService, {
                beginTime,
                endTime,
                collectionId: collection.id,
            });

            const query = gql`
                query GetCollection($id: String!) {
                    collection(id: $id) {
                        name
                        displayName
                        kind

                        organization {
                            name
                        }

                        contract {
                            beginTime
                            endTime
                        }
                    }
                }
            `;

            const variables = { id: collection.id };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.name).toEqual(collection.name);
                    expect(body.data.collection.displayName).toEqual(collection.displayName);
                    expect(body.data.collection.organization.name).toEqual(organization.name);
                    expect(body.data.collection.contract).toBeDefined();
                    expect(body.data.collection.contract.beginTime).toEqual(beginTime);
                    expect(body.data.collection.contract.endTime).toEqual(endTime);
                });
        });

        it('should get a collection by id with no contract details, if contract doesn\'t exist', async () => {
            const query = gql`
                query GetCollection($id: String!) {
                    collection(id: $id) {
                        name
                        displayName
                        kind

                        organization {
                            name
                        }

                        contract {
                            beginTime
                            endTime
                        }
                    }
                }
            `;

            const variables = { id: collection.id };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.name).toEqual(collection.name);
                    expect(body.data.collection.displayName).toEqual(collection.displayName);
                    expect(body.data.collection.organization.name).toEqual(organization.name);
                    expect(body.data.collection.contract).toBe(null);
                });
        });

        it('should get a collection by address', async () => {
            const query = gql`
                query GetCollection($address: String!) {
                    collection(address: $address) {
                        name
                        displayName
                        kind

                        organization {
                            name
                        }
                    }
                }
            `;

            const variables = { address: collection.address };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.name).toEqual(collection.name);
                    expect(body.data.collection.displayName).toEqual(collection.displayName);
                    expect(body.data.collection.organization.name).toEqual(organization.name);
                });
        });

        it('should get a collection by slug', async () => {
            const query = gql`
                query GetCollection($slug: String!) {
                    collection(slug: $slug) {
                        name
                        displayName
                        kind
                        slug
                    }
                }
            `;

            const variables = { slug: collection.slug };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.name).toEqual(collection.name);
                    expect(body.data.collection.slug).toEqual(collection.slug);
                    expect(body.data.collection.displayName).toEqual(collection.displayName);
                });
        });

        it('should get a collection by id with tiers', async () => {
            await createTier(tierService, {
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });

            await createTier(tierService, {
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                name: faker.company.name(),
                totalMints: 100,
            });

            const query = gql`
                query GetCollection($id: String!) {
                    collection(id: $id) {
                        name
                        displayName
                        kind

                        organization {
                            name
                        }

                        tiers {
                            id
                            totalMints
                            totalSold
                            profit {
                                inPaymentToken
                                inUSDC
                            }
                        }
                    }
                }
            `;

            const variables = { id: collection.id };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.name).toEqual(collection.name);
                    expect(body.data.collection.displayName).toEqual(collection.displayName);
                    expect(body.data.collection.organization.name).toEqual(organization.name);
                    expect(body.data.collection.tiers).toBeDefined();
                    expect(body.data.collection.tiers[0].totalMints).toEqual(100);
                    expect(body.data.collection.tiers[0].totalSold).toBeDefined();
                    expect(body.data.collection.tiers[0].profit).toBeDefined();
                });
        });

        it('should return tier info and the coin info contained in the tier', async () => {
            collection = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: { id: organization.id },
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
                        tierId: 0,
                        price: '200',
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
                    },
                ],
            });

            const query = gql`
                query GetCollection($address: String) {
                    collection(address: $address) {
                        tiers {
                            coin {
                                address
                            }
                        }
                    }
                }
            `;
            const variables = { address: collection.address };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.tiers).not.toBeNull();
                    expect(body.data.collection.tiers).not.toBeNull();
                    expect(body.data.collection.tiers[0].coin).not.toBeNull();
                    expect(body.data.collection.tiers[0].coin.address).not.toBeNull();
                });
        });

        it('should return the buyers', async () => {
            const transaction = await createMintSaleTransaction(mintSaleTransactionService, {
                collectionId: collection.id,
                address: collection.address,
            });

            const query = gql`
                query Collection($address: String!) {
                    collection(address: $address) {
                        buyers
                    }
                }
            `;

            const variables = { address: collection.address };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(async ({ body }) => {
                    expect(body.data.collection.buyers).toEqual([transaction.recipient]);
                });
        });
    });

    describe('createCollection', () => {
        it('should not allow unauthenticated users to create a collection', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet1 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });

            const collaboration = await collaborationService.createCollaboration({
                walletId: wallet1.id,
                royaltyRate: 98,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                    },
                ],
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
                owner,
            });

            const query = gql`
                mutation CreateCollection($input: CreateCollectionInput!) {
                    createCollection(input: $input) {
                        name
                        displayName
                        kind
                    }
                }
            `;

            const variables = {
                input: {
                    name: faker.company.name(),
                    displayName: 'The best collection',
                    about: 'The best collection ever',
                    kind: CollectionKind.edition,
                    address: faker.finance.ethereumAddress(),
                    organization: {
                        id: organization.id,
                    },
                    collaboration: {
                        id: collaboration.id,
                    },
                    tags: ['test'],
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

        it('should not allow pass a organization which not user belongs to', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet1 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });

            const collaboration = await collaborationService.createCollaboration({
                walletId: wallet1.id,
                royaltyRate: 98,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                    },
                ],
            });

            const _organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner,
            });

            const anotherOwner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const anotherOrganization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: anotherOwner,
            });


            const query = gql`
                mutation CreateCollection($input: CreateCollectionInput!) {
                    createCollection(input: $input) {
                        name
                        displayName
                        kind
                    }
                }
            `;

            const variables = {
                input: {
                    name: faker.company.name(),
                    displayName: 'The best collection',
                    about: 'The best collection ever',
                    kind: CollectionKind.edition,
                    address: faker.finance.ethereumAddress(),
                    organization: {
                        id: anotherOrganization.id,
                    },
                    collaboration: {
                        id: collaboration.id,
                    },
                    tags: ['test'],
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

        it('should throw an error if collection name already exist', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet1 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });

            const collaboration = await collaborationService.createCollaboration({
                walletId: wallet1.id,
                royaltyRate: 98,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                    },
                ],
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
                owner,
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
                mutation CreateCollection($input: CreateCollectionInput!) {
                    createCollection(input: $input) {
                        name
                        displayName
                        kind
                    }
                }
            `;

            const variables = {
                input: {
                    name: faker.company.name(),
                    displayName: 'The best collection',
                    about: 'The best collection ever',
                    kind: CollectionKind.edition,
                    address: faker.finance.ethereumAddress(),
                    organization: {
                        id: organization.id,
                    },
                    collaboration: {
                        id: collaboration.id,
                    },
                    tags: ['test'],
                },
            };

            await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createCollection.name).toEqual(variables.input.name);
                    expect(body.data.createCollection.displayName).toEqual(variables.input.displayName);
                });

            await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].message).toMatch(`The collection name ${variables.input.name} is already taken`);
                });
        });

        it('should allow authenticated users to create a collection', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet1 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });

            const collaboration = await collaborationService.createCollaboration({
                walletId: wallet1.id,
                royaltyRate: 98,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                    },
                ],
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
                owner,
            });

            const tokenVariables = {
                input: {
                    email: owner.email,
                    password: 'password',
                },
            };

            const authToken = await getToken(tokenVariables);

            const query = gql`
                mutation CreateCollection($input: CreateCollectionInput!) {
                    createCollection(input: $input) {
                        name
                        slug
                        displayName
                        kind
                    }
                }
            `;

            const name = faker.company.name();
            const variables = {
                input: {
                    name,
                    displayName: 'The best collection',
                    about: 'The best collection ever',
                    kind: CollectionKind.edition,
                    address: faker.finance.ethereumAddress(),
                    organization: {
                        id: organization.id,
                    },
                    collaboration: {
                        id: collaboration.id,
                    },
                    tags: ['test'],
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createCollection.name).toEqual(variables.input.name);
                    expect(body.data.createCollection.slug).toEqual(generateSlug(name));
                    expect(body.data.createCollection.displayName).toEqual(variables.input.displayName);
                });
        });
    });

    describe('updateCollection', () => {
        it('should update a collection', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
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
                mutation UpdateCollection($input: UpdateCollectionInput!) {
                    updateCollection(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: collection.id,
                    name: faker.company.name(),
                    displayName: 'The best collection',
                    about: 'The best collection ever',
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(async ({ body }) => {
                    expect(body.data.updateCollection).toBeTruthy();
                });
        });

        it('should update beginSaleAt', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const beginSaleAt = Math.round(new Date().valueOf() / 1000);
            const endSaleAt = Math.round(new Date().valueOf() / 1000) + 1000;

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                beginSaleAt: beginSaleAt,
                endSaleAt: endSaleAt,
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
                mutation UpdateCollection($input: UpdateCollectionInput!) {
                    updateCollection(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: collection.id,
                    name: faker.company.name(),
                    displayName: 'The best collection',
                    about: 'The best collection ever',
                    beginSaleAt: beginSaleAt + 100,
                    endSaleAt: endSaleAt + 100,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(async ({ body }) => {
                    expect(body.data.updateCollection).toBeTruthy();
                });
        });
    });

    describe('deleteCollection', () => {
        it('should delete a collection', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
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
                mutation DeleteCollection($input: CollectionInput!) {
                    deleteCollection(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: collection.id,
                },
            };
            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(async ({ body }) => {
                    expect(body.data.deleteCollection).toBeTruthy();
                });
        });
    });

    describe('secondaryMarketStat', () => {
        let collection: Collection;

        beforeEach(async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
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
                owner,
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

            collection = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: { id: organization.id },
                nameOnOpensea: faker.finance.accountName(),
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
                        tierId: 0,
                        price: '200',
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
                    },
                ],
            });
        });

        it.skip('should get stat data', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
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
                owner,
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

            collection = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: { id: organization.id },
                nameOnOpensea: faker.finance.accountName(),
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
                        tierId: 0,
                        price: '200',
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
                    },
                ],
            });

            const query = gql`
                query GetSecondaryMarketStat($address: String!) {
                    secondaryMarketStat(address: $address) {
                        source
                        data {
                            supply
                            floorPrice

                            volume {
                                total
                            }
                        }
                    }
                }
            `;

            const variables = { address: collection.address };

            const mockResponse = [
                {
                    source: 'opensea',
                    data: {
                        supply: faker.number.float(),
                        floorPrice: faker.number.float(),
                        volume: {
                            hourly: faker.number.float(),
                            daily: faker.number.float(),
                            weekly: faker.number.float(),
                            monthly: faker.number.float(),
                            total: faker.number.float(),
                        },
                        sales: {
                            hourly: faker.number.float(),
                            daily: faker.number.float(),
                            weekly: faker.number.float(),
                            total: faker.number.float(),
                            monthly: faker.number.float(),
                        },
                        netGrossEarning: faker.number.float(),
                    },
                },
            ] as CollectionStat[];

            jest.spyOn(service, 'getSecondaryMarketStat').mockImplementation(async () => mockResponse);

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(({ body }) => {
                    expect(body.data.secondaryMarketStat.length).toEqual(1);
                    const openseaData = body.data.secondaryMarketStat.find((data) => data.source === 'opensea');
                    expect(openseaData.data.supply).toEqual(mockResponse[0].data.supply);
                    expect(openseaData.data.volume.total).toEqual(mockResponse[0].data.volume.total);
                });
        });
    });

    describe('getHolders', () => {
        const collectionAddress = faker.finance.ethereumAddress().toLowerCase();
        const email = faker.internet.email();
        let coin;
        let owner;
        let organization;
        let collection;
        let authToken;

        beforeEach(async () => {
            coin = await createCoin(coinService);
            owner = await userService.createUser({
                email,
                password: 'password',
            });
            organization = await createOrganization(organizationService, {
                owner,
            });
            await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });

            const tokenVariables = {
                input: {
                    email: owner.email,
                    password: 'password',
                },
            };
            authToken = await getToken(tokenVariables);
            await createMemberships(membershipService, {
                emails: [email],
                organizationId: organization.id,
            });

            const tokenAddress = faker.finance.ethereumAddress().toLowerCase();
            const beginTime = Math.floor(faker.date.recent().getTime() / 1000);

            collection = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: collectionAddress,
                tags: [],
                organization: { id: organization.id },
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
                        tierId: 0,
                        price: '200',
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
                    },
                ],
            });

            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: collectionAddress,
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: beginTime,
                endTime: beginTime + 86400,
                tierId: 0,
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: tokenAddress,
                collectionId: collection.id,
            });

            const owner1 = faker.finance.ethereumAddress().toLowerCase();
            const tokenId1 = faker.string.numeric({ length: 5, allowLeadingZeros: false });

            const owner2 = faker.finance.ethereumAddress().toLowerCase();
            const tokenId2 = faker.string.numeric({ length: 5, allowLeadingZeros: false });

            await asset721Service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId1,
                owner: owner1,
            });
            await asset721Service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId2,
                owner: owner2,
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 0,
                tokenAddress: tokenAddress,
                tokenId: tokenId1,
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 0,
                tokenAddress: tokenAddress,
                tokenId: tokenId2,
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
            });
        });

        it('should get holders', async () => {
            const query = gql`
                query GetCollection($id: String) {
                    collection(id: $id) {
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
                                    tier {
                                        id
                                        tierId
                                        price
                                    }
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
            `;
            const variables = { id: collection.id };
            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.holders).toBeDefined();
                    expect(body.data.collection.holders.totalCount).toEqual(2);
                    expect(body.data.collection.holders.pageInfo).toBeDefined();
                    expect(body.data.collection.holders.edges).toBeDefined();
                    expect(body.data.collection.holders.edges.length).toEqual(2);
                    expect(body.data.collection.holders.edges[0].node.tier).toBeDefined();
                    expect(body.data.collection.holders.edges[0].node.tier.price).toEqual('200');
                });
        });

        it('should get unique holder', async () => {
            const query = gql`
                query GetCollection($id: String) {
                    collection(id: $id) {
                        uniqueHolderCount
                    }
                }
            `;
            const variables = { id: collection.id };
            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.uniqueHolderCount).toBeDefined();
                    expect(body.data.collection.uniqueHolderCount).toEqual(2);
                });
        });

        it('should get activities', async () => {
            const query = gql`
                query GetCollection($id: String) {
                    collection(id: $id) {
                        activities {
                            total
                            data {
                                address
                                tokenId
                                owner
                                type
                                tier {
                                    tierId
                                }
                                transaction {
                                    address
                                    tokenId
                                    price
                                    recipient
                                }
                            }
                        }
                    }
                }
            `;
            const variables = { id: collection.id };
            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.activities).toBeDefined();
                    expect(body.data.collection.activities.total).toEqual(2);
                    expect(body.data.collection.activities.data).toBeDefined();
                    expect(body.data.collection.activities.data.length).toEqual(2);
                    expect(body.data.collection.activities.data.length).toEqual(2);
                    expect(body.data.collection.activities.data[0].tier).toBeDefined();
                    expect(body.data.collection.activities.data[0].transaction).toBeDefined();
                });
        });

        it('should get lending page collections', async () => {
            const query = gql`
                query GetLandingPageCollections($status: String) {
                    landingPage(status: $status) {
                        total
                        data {
                            id
                            address
                        }
                    }
                }
            `;

            const variables = { status: CollectionStatus.active };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(authToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.landingPage).toBeDefined();
                    expect(body.data.landingPage.total).toEqual(1);
                    expect(body.data.landingPage.data).toBeDefined();
                    expect(body.data.landingPage.data.length).toEqual(1);
                    expect(body.data.landingPage.data[0].address).toEqual(collectionAddress);
                });
        });
    });
});
