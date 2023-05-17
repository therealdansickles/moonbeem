import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { User } from './user.entity';
import { UserModule } from './user.module';
import { UserService } from '../user/user.service';

export const gql = String.raw;

describe('UserResolver', () => {
    let repository: Repository<User>;
    let service: UserService;
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
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                UserModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [UserModule],
                }),
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        repository = module.get('UserRepository');
        app = module.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('getUser', () => {
        it('should get an user', async () => {
            const user = await service.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

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

            const variables = { id: user.id };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.user.id).toEqual(user.id);
                    expect(body.data.user.email).toEqual(user.email);
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

    describe('updateUser', () => {
        it('should update an user', async () => {
            const user = await service.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
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
});
