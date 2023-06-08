import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { History721, History721Type } from './history721.entity';
import { History721Module } from './history721.module';
import { History721Service } from './history721.service';
import { ApolloDriver } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

export const gql = String.raw;

describe('History721Resolver', () => {
    let service: History721Service;
    let app: INestApplication;
    let history: History721;

    beforeAll(async () => {
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
                History721Module,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [History721Module],
                }),
            ],
        }).compile();

        service = module.get<History721Service>(History721Service);
        app = module.createNestApplication();

        history = await service.createHistory721({
            height: parseInt(faker.random.numeric(5)),
            txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
            txTime: Math.floor(faker.date.recent().getTime() / 1000),
            address: faker.finance.ethereumAddress(),
            tokenId: faker.random.numeric(5),
            sender: faker.finance.ethereumAddress(),
            receiver: faker.finance.ethereumAddress(),
            kind: History721Type.unknown,
        });

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('history721', () => {
        it('should get an nft history', async () => {
            const query = gql`
                query GetHistory721($id: String!) {
                    history721(id: $id) {
                        id
                        chainId
                    }
                }
            `;

            const variables = {
                id: history.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.history721.id).toEqual(history.id);
                });
        });
    });
});
