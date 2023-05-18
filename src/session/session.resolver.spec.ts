import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';
import { ethers } from 'ethers';
import { hashSync as hashPassword } from 'bcryptjs';

import { SessionModule } from './session.module';
import { WalletModule } from '../wallet/wallet.module';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';

const gql = String.raw;

describe('SessionResolver', () => {
    let app: INestApplication;
    let userService: UserService;

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
                SessionModule,
                UserModule,
                WalletModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [SessionModule],
                }),
            ],
        }).compile();

        userService = module.get<UserService>(UserService);

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('createSession', () => {
        it('should create a session', async () => {
            const wallet = await ethers.Wallet.createRandom();
            const message = 'in test';
            const signature = await wallet.signMessage(message);

            const query = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        wallet {
                            id
                            address
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createSession.token).toBeDefined();
                    expect(body.data.createSession.wallet.address).toEqual(wallet.address);
                });
        });
    });

    describe('createSession', () => {
        it('should create a session', async () => {
            const wallet = await ethers.Wallet.createRandom();
            const message = 'in test';
            const signature = await wallet.signMessage(message);

            const query = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        wallet {
                            id
                            address
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createSession.token).toBeDefined();
                    expect(body.data.createSession.wallet.address).toEqual(wallet.address);
                });
        });
    });

    describe('createSessionFromEmail', () => {
        it('should create a session', async () => {
            let user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const query = gql`
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

            const variables = {
                input: {
                    email: user.email,
                    password: await hashPassword('password', 10),
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createSessionFromEmail.token).toBeDefined();
                    expect(body.data.createSessionFromEmail.user.email).toEqual(user.email);
                });
        });
    });
});
