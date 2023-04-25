import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { Wallet } from './wallet.entity';
import { WalletModule } from './wallet.module';
import { WalletService } from './wallet.service';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';

export const gql = String.raw;

describe('WalletResolver', () => {
    let repository: Repository<Wallet>;
    let service: WalletService;
    let authService: AuthService;
    let userService: UserService;
    let app: INestApplication;
    let address: string;

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
                WalletModule,
                AuthModule,
                CollaborationModule,
                UserModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [AuthModule, WalletModule],
                }),
            ],
        }).compile();

        repository = module.get('WalletRepository');
        service = module.get<WalletService>(WalletService);
        authService = module.get<AuthService>(AuthService);
        userService = module.get<UserService>(UserService);
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Wallet" CASCADE');
        await app.close();
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

        it('should create a wallet', async () => {
            address = faker.finance.ethereumAddress();
            const user = await authService.createUserWithEmail({
                email: faker.internet.email(),
                password: faker.internet.password(),
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
                    ownerId: user.user.id,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createWallet.address).toEqual(address);
                    expect(body.data.createWallet.owner.id).toEqual(user.user.id);
                });
        });
    });

    describe('bindWallet', () => {
        it('should bind a wallet', async () => {
            const name = faker.internet.userName();
            const email = faker.internet.email();
            const password = faker.internet.password();
            const owner = await userService.createUser({
                name,
                email,
                password,
            });
            const credentials = await authService.createUserWithEmail({
                email,
                password,
            });
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

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
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(credentials.sessionToken, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.bindWallet.owner.id).toEqual(variables.input.owner.id);
                });
        });
    });

    describe('unbindWallet', () => {
        it('should unbind a wallet', async () => {
            const owner = await userService.createUser({
                name: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });
            await service.bindWallet({
                address: wallet.address,
                owner: { id: owner.id },
            });

            const query = gql`
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
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.unbindWallet.owner.id).not.toEqual(owner.id);
                    expect(body.data.unbindWallet.owner.id).toEqual('00000000-0000-0000-0000-000000000000');
                });
        });
    });
});
