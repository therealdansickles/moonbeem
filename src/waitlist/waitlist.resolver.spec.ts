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
                    host: postgresConfig.host,
                    port: postgresConfig.port,
                    username: postgresConfig.username,
                    password: postgresConfig.password,
                    database: postgresConfig.database,
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
            const address = faker.finance.ethereumAddress();

            await service.createWaitlist({
                email,
                address,
            });

            const query = gql`
                query getWaitlist($email: String!) {
                    getWaitlist(email: $email) {
                        id
                        email
                        seatNumber
                        address
                    }
                }
            `;

            const variables = { email };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.getWaitlist.email).toEqual(email);
                    expect(body.data.getWaitlist.address).toEqual(address);
                });
        });
    });

    describe('createWaitlist', () => {
        it('should create a waitlist item by email', async () => {
            const email = faker.internet.email();
            const address = faker.finance.ethereumAddress();

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
                    address,
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
    });
});
