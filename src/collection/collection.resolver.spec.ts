import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { Collection, CollectionKind } from './collection.entity';
import { CollectionModule } from './collection.module';
import { CollectionService } from './collection.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { TierService } from '../tier/tier.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import { CoinModule } from '../sync-chain/coin/coin.module';

export const gql = String.raw;

describe('CollectionResolver', () => {
    let repository: Repository<Collection>;
    let service: CollectionService;
    let app: INestApplication;
    let authService: AuthService;
    let organizationService: OrganizationService;
    let userService: UserService;
    let tierService: TierService;
    let coinService: CoinService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
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
                }),
                CoinModule,
                AuthModule,
                CollectionModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [AuthModule, CollectionModule, CoinModule],
                }),
            ],
        }).compile();

        repository = module.get('CollectionRepository');
        service = module.get<CollectionService>(CollectionService);
        authService = module.get<AuthService>(AuthService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        userService = module.get<UserService>(UserService);
        tierService = module.get<TierService>(TierService);
        coinService = module.get<CoinService>(CoinService);

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "User" CASCADE');
        await repository.query('TRUNCATE TABLE "Organization" CASCADE');
        await repository.query('TRUNCATE TABLE "Collection" CASCADE');
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
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
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
                });
        });
    });

    describe('createCollection', () => {
        it('should not allow unauthenticated users to create a collection', async () => {
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
            const credentials = await authService.createUserWithEmail({
                email: faker.internet.email(),
                password: faker.internet.password(),
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
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(credentials.sessionToken, { type: 'bearer' })
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
                mutation DeleteCollection($input: DeleteCollectionInput!) {
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
});
