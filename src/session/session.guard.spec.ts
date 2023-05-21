import * as request from 'supertest';
import { APP_GUARD } from '@nestjs/core';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

import { JwtService } from '@nestjs/jwt';
import { Resolver, Query } from '@nestjs/graphql';
import { SessionGuard } from './session.guard';
import { SessionModule } from './session.module';
import { WalletModule } from '../wallet/wallet.module';
import { CurrentWallet, Public } from './session.decorator';
import { Wallet } from '../wallet/wallet.dto';

const gql = String.raw;

@Resolver()
export class TestResolver {
    @Query(() => String)
    test(@CurrentWallet() wallet: Wallet): string {
        return wallet.address;
    }
}

describe('SessionGuard', () => {
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
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                WalletModule,
                SessionModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                }),
            ],
            providers: [
                {
                    provide: APP_GUARD,
                    useClass: SessionGuard,
                },
                JwtService,
                TestResolver,
            ],
        }).compile();

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should not authenticate a wallet with an invalid token', async () => {
        const query = gql`
            query Test {
                test
            }
        `;

        return request(app.getHttpServer())
            .post('/graphql')
            .auth('test', { type: 'bearer' })
            .send({ query })
            .expect(200)
            .expect(({ body }) => {
                const [err, ..._rest] = body.errors;
                expect(err.message).toEqual('Forbidden resource');
            });
    });

    it('should authenticate a wallet with a valid token', async () => {
        const wallet = ethers.Wallet.createRandom();
        const message = 'welcome to vibe';
        const signature = await wallet.signMessage(message);
        var createSession = {};

        const query = gql`
            mutation CreateSession($input: CreateSessionInput!) {
                createSession(input: $input) {
                    token
                }
            }
        `;

        const input = {
            address: wallet.address,
            message,
            signature,
        };

        let result = await request(app.getHttpServer())
            .post('/graphql')
            .send({ query, variables: { input } })
            .then((resp) => {
                return resp.body.data.createSession;
            });

        const authedQuery = gql`
            query Test {
                test
            }
        `;

        return request(app.getHttpServer())
            .post('/graphql')
            .auth(result.token, { type: 'bearer' })
            .send({ query: authedQuery })
            .expect(200)
            .expect(({ body }) => {
                const { test } = body.data;
                expect(test).toEqual(wallet.address.toLowerCase());
            });
    });
});
