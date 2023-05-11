import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { User } from '../user/user.entity';
import { Repository } from 'typeorm';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletService } from '../wallet/wallet.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from '../lib/configs/db.config';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { AuthModule } from './auth.module';

export const gql = String.raw;

describe('AuthResolver', () => {
    let app: INestApplication;
    let repository: Repository<User>;
    let service: AuthService;
    let user: User;
    let userService: UserService;
    let wallet: Wallet;
    let walletService: WalletService;
    let email;

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
                AuthModule,
                UserModule,
                WalletModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [AuthModule, UserModule, WalletModule],
                }),
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    describe('createUserWithEmail', () => {
        it('should create a user with email/password', async () => {
            email = faker.internet.email();

            const query = gql`
                mutation createUserWithEmail($input: CreateUserWithEmailInput!) {
                    createUserWithEmail(input: $input) {
                        sessionToken
                        user {
                            email
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    email,
                    password: 'testsAreFun',
                    username: faker.internet.userName(),
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createUserWithEmail.sessionToken).toBeDefined();
                    expect(body.data.createUserWithEmail.user.id).toBeDefined();
                });
        });
    });

    describe('loginWithEmail', () => {
        it('should successfully login with correct email and password combo', async () => {
            const query = gql`
                mutation loginWithEmail($email: String!, $password: String!) {
                    loginWithEmail(input: { email: $email, password: $password }) {
                        sessionToken
                        user {
                            email
                            id
                        }
                    }
                }
            `;

            const variables = {
                email,
                password: 'testsAreFun',
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.loginWithEmail.sessionToken).toBeDefined();
                    expect(body.data.loginWithEmail.user.id).toBeDefined();
                });
        });

        it('should fail login with wrong email and password combo', async () => {
            const query = gql`
                mutation loginWithEmail($email: String!, $password: String!) {
                    loginWithEmail(input: { email: $email, password: $password }) {
                        sessionToken
                        user {
                            email
                            id
                        }
                    }
                }
            `;

            const variables = {
                email,
                password: 'testsAreSuperFun',
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].message).toBe(
                        'Verification failed. Please check your username or password and try again.'
                    );
                    expect(body.errors[0].extensions.code).toBe('UNAUTHORIZED');
                });
        });
    });
});
