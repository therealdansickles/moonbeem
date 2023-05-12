import * as request from 'supertest';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

import { WaitlistModule } from './waitlist.module';
import { WaitlistService } from './waitlist.service';

export const gql = String.raw;

describe('WaitlistResolver', () => {
    let service: WaitlistService;
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
                WaitlistModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [WaitlistModule],
                }),
            ],
        }).compile();

        service = module.get<WaitlistService>(WaitlistService);
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('getWaitlist', () => {
        it('should get a waitlist item by email', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            await service.createWaitlist({
                email,
                address: randomWallet.address,
                message,
                signature,
            });

            const query = gql`
                query getWaitlist($input: GetWaitlistInput!) {
                    getWaitlist(input: $input) {
                        id
                        email
                        seatNumber
                        address
                    }
                }
            `;

            const variables = {
                input: {
                    email,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.getWaitlist.email).toEqual(email);
                    expect(body.data.getWaitlist.address).toEqual(randomWallet.address);
                });
        });

        it('should get a waitlist item by address', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            await service.createWaitlist({
                email,
                address: randomWallet.address,
                message,
                signature,
            });

            const query = gql`
                query getWaitlist($input: GetWaitlistInput!) {
                    getWaitlist(input: $input) {
                        id
                        email
                        seatNumber
                        address
                    }
                }
            `;

            const variables = {
                input: {
                    address: randomWallet.address,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.getWaitlist.email).toEqual(email);
                    expect(body.data.getWaitlist.address).toEqual(randomWallet.address);
                });
        });
    });

    describe('createWaitlist', () => {
        it('should create a waitlist item by email', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const query = gql`
                mutation CreateWaitlist($input: CreateWaitlistInput!) {
                    createWaitlist(input: $input) {
                        id
                        email
                        seatNumber
                    }
                }
            `;

            const variables = {
                input: {
                    email,
                    address: randomWallet.address,
                    message,
                    signature,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createWaitlist.email).toEqual(email);
                    expect(body.data.createWaitlist.id).toBeDefined();
                    expect(body.data.createWaitlist.seatNumber).toBeDefined();
                });
        });

        it('should not create a waitlist item with wrong signature', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const randomWallet2 = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const query = gql`
                mutation CreateWaitlist($input: CreateWaitlistInput!) {
                    createWaitlist(input: $input) {
                        id
                        email
                        seatNumber
                    }
                }
            `;

            const variables = {
                input: {
                    email,
                    address: randomWallet2.address,
                    message,
                    signature,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors).toBeDefined();
                    expect(body.errors[0].message).toEqual('signature verification failure');
                });
        });
    });

    describe('claimWaitlist', () => {
        it('should successfully claim a waitlist item by address', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const waitlist = await service.createWaitlist({
                email,
                address: randomWallet.address,
                signature,
                message,
            });

            const query = gql`
                mutation ClaimWaitlist($input: ClaimWaitlistInput!) {
                    claimWaitlist(input: $input)
                }
            `;

            const variables = {
                input: {
                    address: randomWallet.address,
                    message,
                    signature,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.claimWaitlist).toBeTruthy();
                });
        });
    });
});
