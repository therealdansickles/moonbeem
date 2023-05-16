import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { Record721Service } from './record721.service';
import { Record721 } from './record721.entity';
import { Record721Module } from './record721.module';

export const gql = String.raw;

describe.only('Record721Resolver', () => {
    let repository: Repository<Record721>;
    let service: Record721Service;
    let app: INestApplication;
    let record: Record721;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
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
                Record721Module,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [Record721Module],
                }),
            ],
        }).compile();

        repository = module.get('sync_chain_Record721Repository');
        service = module.get<Record721Service>(Record721Service);
        app = module.createNestApplication();

        record = await service.createRecord721({
            height: parseInt(faker.random.numeric(5)),
            txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
            txTime: Math.floor(faker.date.recent().getTime() / 1000),
            address: faker.finance.ethereumAddress(),
            name: 'USC Coin',
            symbol: 'USDC',
            baseUri: 'https://',
            owner: faker.finance.ethereumAddress(),
        });

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('erc721 record', () => {
        it('should return contract info', async () => {
            const query = gql`
                query GetRecord721($id: String!) {
                    record721(id: $id) {
                        id
                    }
                }
            `;

            const variables = {
                id: record.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.record721.id).toEqual(record.id);
                });
        });
    });
});
