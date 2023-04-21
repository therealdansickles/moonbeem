import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { Collection, CollectionKind } from './collection.entity';
import { CollectionModule } from './collection.module';
import { CollectionService } from './collection.service';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';

export const gql = String.raw;

describe('CollectionResolver', () => {
    let repository: Repository<Collection>;
    let service: CollectionService;
    let app: INestApplication;
    let authService: AuthService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: postgresConfig.host,
                    port: postgresConfig.port,
                    username: postgresConfig.username,
                    password: postgresConfig.password,
                    database: postgresConfig.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                AuthModule,
                CollectionModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [AuthModule, CollectionModule],
                }),
            ],
        }).compile();

        repository = module.get('CollectionRepository');
        service = module.get<CollectionService>(CollectionService);
        authService = module.get<AuthService>(AuthService);
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Collection" CASCADE');
        await app.close();
    });

    describe('collection', () => {
        it('should get a collection by id', async () => {
            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });

            const query = gql`
                query GetCollection($id: String!) {
                    collection(id: $id) {
                        name
                        displayName
                        kind
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
