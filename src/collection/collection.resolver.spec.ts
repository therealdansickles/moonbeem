import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { CoinService } from '../sync-chain/coin/coin.service';
import { CollaborationService } from '../collaboration/collaboration.service';
import { Collection, CollectionKind } from './collection.entity';
import { CollectionModule } from './collection.module';
import { CollectionService } from './collection.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { OrganizationService } from '../organization/organization.service';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { CollectionStatus } from './collection.dto';

export const gql = String.raw;

describe('CollectionResolver', () => {
    let repository: Repository<Collection>;
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
                CollectionModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [CollectionModule],
                }),
            ],
        }).compile();

        repository = module.get('CollectionRepository');
        service = module.get<CollectionService>(CollectionService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        collaborationService = module.get<CollaborationService>(CollaborationService);
        userService = module.get<UserService>(UserService);
        tierService = module.get<TierService>(TierService);
        coinService = module.get<CoinService>(CoinService);
        mintSaleTransactionService = module.get<MintSaleTransactionService>(MintSaleTransactionService);
        mintSaleContractService = module.get<MintSaleContractService>(MintSaleContractService);
        asset721Service = module.get<Asset721Service>(Asset721Service);
        walletService = module.get<WalletService>(WalletService);

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('collection', () => {
        it('should get a collection by id', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
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

                        collaboration {
                            id
                        }
                    }
                }
            `;

            const variables = { id: collection.id };

            return await request(app.getHttpServer())
                .post('/graphql')
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
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const beginTime = Math.floor(faker.date.recent().getTime() / 1000);
            const endTime = Math.floor(faker.date.recent().getTime() / 1000);

            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime,
                endTime,
                tierId: 0,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
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

        it('should get a collection by id with no contract details, if contract doesnt exist', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
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
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

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
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.name).toEqual(collection.name);
                    expect(body.data.collection.displayName).toEqual(collection.displayName);
                    expect(body.data.collection.organization.name).toEqual(organization.name);
                });
        });

        it('should get a collection by id with tiers', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
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

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
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
    });

    describe('createCollection', () => {
        it.skip('should not allow unauthenticated users to create a collection', async () => {
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
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors).toBeDefined();
                    expect(body.errors[0].extensions.response.statusCode).toEqual(401);
                });
        });

        it('should allow authenticated users to create a collection', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
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
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
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
                    expect(body.data.createCollection.name).toEqual(variables.input.name);
                    expect(body.data.createCollection.displayName).toEqual(variables.input.displayName);
                });
        });
    });

    describe('updateCollection', () => {
        it('should update a collection', async () => {
            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });

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
                .send({ query, variables })
                .expect(200)
                .expect(async ({ body }) => {
                    expect(body.data.updateCollection).toBeTruthy();
                });
        });
    });

    describe('deleteCollection', () => {
        it('should delete a collection', async () => {
            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });

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
                .send({ query, variables })
                .expect(200)
                .expect(async ({ body }) => {
                    expect(body.data.deleteCollection).toBeTruthy();
                });
        });
    });

    describe('buyers', () => {
        it('should return the buyers', async () => {
            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
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
                paymentToken: faker.finance.ethereumAddress(),
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
                .send({ query, variables })
                .expect(200)
                .expect(async ({ body }) => {
                    expect(body.data.collection.buyers).toEqual([transaction.recipient]);
                });
        });
    });

    describe('collection', () => {
        it('should return tier info and the coin info contained in the tier', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
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

            const collection = await service.createCollectionWithTiers({
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
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.tiers).not.toBeNull();
                    expect(body.data.collection.tiers).not.toBeNull();
                    expect(body.data.collection.tiers[0].coin).not.toBeNull();
                    expect(body.data.collection.tiers[0].coin.address).not.toBeNull();
                });
        });
    });

    describe('secondaryMarketStat', () => {
        let collection: Collection;

        beforeEach(async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
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
                    },
                ],
            });
        });

        afterEach(async () => {
            await repository.query('TRUNCATE TABLE "User" CASCADE;');
            await repository.query('TRUNCATE TABLE "Organization" CASCADE;');
            await repository.query('TRUNCATE TABLE "Collection" CASCADE;');
        });

        it('should get stat data', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
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
                        supply: faker.datatype.float(),
                        floorPrice: faker.datatype.float(),
                        volume: {
                            hourly: faker.datatype.float(),
                            daily: faker.datatype.float(),
                            weekly: faker.datatype.float(),
                            total: faker.datatype.float(),
                        },
                        sales: {
                            hourly: faker.datatype.float(),
                            daily: faker.datatype.float(),
                            weekly: faker.datatype.float(),
                            total: faker.datatype.float(),
                        },
                    },
                },
            ];
            jest.spyOn(service, 'getSecondartMarketStat').mockImplementation(async () => mockResponse);
            await service.getSecondartMarketStat({ address: collection.address });

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
        let collection: Collection;
        beforeAll(async () => {
            const tokenAddress = faker.finance.ethereumAddress().toLowerCase();
            const beginTime = Math.floor(faker.date.recent().getTime() / 1000);

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

            const user = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: user,
            });

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
                    },
                ],
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
                beginTime: beginTime,
                endTime: beginTime + 86400,
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
            const tokenId1 = faker.random.numeric(5);

            const owner2 = faker.finance.ethereumAddress().toLowerCase();
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
                address: faker.finance.ethereumAddress(),
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
                address: faker.finance.ethereumAddress(),
                tierId: 0,
                tokenAddress: tokenAddress,
                tokenId: tokenId2,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });
        });

        it('should get holders', async () => {
            const query = gql`
                query GetCollection($id: String) {
                    collection(id: $id) {
                        holder {
                            total
                            data {
                                quantity
                                tier {
                                    id
                                    price
                                }
                            }
                        }
                    }
                }
            `;
            const variables = { id: collection.id };
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collection.holder).toBeDefined();
                    expect(body.data.collection.holder.total).toEqual(2);
                    expect(body.data.collection.holder.data).toBeDefined();
                    expect(body.data.collection.holder.data.length).toEqual(2);
                    expect(body.data.collection.holder.data.length).toEqual(2);
                    expect(body.data.collection.holder.data[0].tier).toBeDefined();
                    expect(body.data.collection.holder.data[0].tier.price).toEqual('200');
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
