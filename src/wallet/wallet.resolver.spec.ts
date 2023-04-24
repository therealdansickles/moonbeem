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

export const gql = String.raw;

describe('WalletResolver', () => {
    let repository: Repository<Wallet>;
    let service: WalletService;
    let authService: AuthService;
    let app: INestApplication;

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
            const address = faker.finance.ethereumAddress();
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

    //describe('bindWallet', () => {
    //it('should bind a wallet', async () => {
    //const owner = await userService.createUser({ email: faker.internet.email() });

    //const query = gql`
    //mutation BindWallet($address: String!, $ownerId: String!) {
    //bindWallet(address: $address, ownerId: $ownerId) {
    //address
    //ownerId
    //}
    //}
    //`;

    //const variables = {
    //address: `arb:${faker.finance.ethereumAddress()}`,
    //ownerId: owner.id,
    //};

    //return request(app.getHttpServer())
    //.post('/graphql')
    //.send({ query, variables })
    //.expect(200)
    //.expect(({ body }) => {
    //expect(body.data.bindWallet.ownerId).toEqual(variables.ownerId);
    //});
    //});
    //});

    //describe('unbindWallet', () => {
    //it('should unbind a wallet', async () => {
    //const owner = await userService.createUser({ email: faker.internet.email() });
    //const boundWallet = await service.bindWallet({ address: faker.finance.ethereumAddress(), ownerId: owner.id });

    //const query = gql`
    //mutation UnbindWallet($address: String!, $ownerId: String!) {
    //unbindWallet(address: $address, ownerId: $ownerId) {
    //address
    //ownerId
    //}
    //}
    //`;

    //const variables = {
    //address: boundWallet.address,
    //ownerId: owner.id,
    //};

    //return request(app.getHttpServer())
    //.post('/graphql')
    //.send({ query, variables })
    //.expect(200)
    //.expect(({ body }) => {
    //expect(body.data.unbindWallet.ownerId).not.toEqual(owner.id);
    //});
    //});
    //});
});
