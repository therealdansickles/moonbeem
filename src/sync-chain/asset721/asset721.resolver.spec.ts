import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { Asset721Module } from './asset721.module';
import { Asset721Service } from './asset721.service';
import { Asset721 } from './asset721.entity';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';

export const gql = String.raw;

describe.only('Asset721Resolver', () => {
    let repository: Repository<Asset721>;
    let service: Asset721Service;
    let app: INestApplication;
    let asset721: Asset721;

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
                Asset721Module,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [Asset721Module],
                }),
            ],
        }).compile();

        repository = module.get('sync_chain_Asset721Repository');
        service = module.get<Asset721Service>(Asset721Service);
        app = module.createNestApplication();

        asset721 = await service.createAsset721({
            height: parseInt(faker.random.numeric(5)),
            txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
            txTime: Math.floor(faker.date.recent().getTime() / 1000),
            address: faker.finance.ethereumAddress(),
            tokenId: faker.random.numeric(5),
            owner: faker.finance.ethereumAddress(),
        });

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('asset721', () => {
        it('should return an factory', async () => {
            const query = gql`
                query GetAsset721($id: String!) {
                    asset721(id: $id) {
                        id
                        chainId
                    }
                }
            `;

            const variables = {
                id: asset721.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.asset721.id).toEqual(asset721.id);
                });
        });
    });
});
