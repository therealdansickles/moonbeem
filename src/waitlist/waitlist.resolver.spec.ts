import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { Waitlist } from './waitlist.entity';
import { WaitlistService } from './waitlist.service';
import { WaitlistModule } from './waitlist.module';
import { ethers } from 'ethers';

export const gql = String.raw;

describe('WaitlistResolver', () => {
    let repository: Repository<Waitlist>;
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
                }),
                WaitlistModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [WaitlistModule],
                }),
            ],
        }).compile();

        repository = module.get('WaitlistRepository');
        service = module.get<WaitlistService>(WaitlistService);
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Waitlist" CASCADE');
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
                    expect(body.errors[0].extensions.exception.status).toEqual(400);
                    expect(body.errors[0].message).toEqual('signature verification failure');
                });
        });
    });
});
