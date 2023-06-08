import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { ApolloDriver } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from '../../lib/configs/db.config';
import { Royalty } from './royalty.entity';
import { RoyaltyModule } from './royalty.module';
import { RoyaltyService } from './royalty.service';
import { faker } from '@faker-js/faker';

export const gql = String.raw;

describe('RoyaltyResolver', () => {
    let service: RoyaltyService;
    let app: INestApplication;
    let royalty: Royalty;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                RoyaltyModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [RoyaltyModule],
                }),
            ],
        }).compile();

        service = module.get<RoyaltyService>(RoyaltyService);
        app = module.createNestApplication();

        royalty = await service.createRoyalty({
            height: parseInt(faker.random.numeric(5)),
            txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
            txTime: Math.floor(faker.date.recent().getTime() / 1000),
            sender: faker.finance.ethereumAddress(),
            address: faker.finance.ethereumAddress(),
            userAddress: faker.finance.ethereumAddress(),
            userRate: faker.random.numeric(3),
        });

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('royalty', () => {
        it('should return an factory', async () => {
            const query = gql`
                query GetRoyalty($id: String!) {
                    royalty(id: $id) {
                        id
                        chainId
                    }
                }
            `;

            const variables = {
                id: royalty.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.royalty.id).toEqual(royalty.id);
                });
        });
    });
});
