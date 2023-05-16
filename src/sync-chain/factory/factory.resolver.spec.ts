import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { ApolloDriver } from '@nestjs/apollo';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TestingModule, Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { postgresConfig } from '../../lib/configs/db.config';
import { ContractType, Factory } from './factory.entity';
import { FactoryService } from './factory.service';
import { FactoryModule } from './factory.module';

export const gql = String.raw;

describe('FactoryResolver', () => {
    let repository: Repository<Factory>;
    let service: FactoryService;
    let app: INestApplication;
    let factory: Factory;

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
                FactoryModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [FactoryModule],
                }),
            ],
        }).compile();

        repository = module.get('sync_chain_FactoryRepository');
        service = module.get<FactoryService>(FactoryService);
        app = module.createNestApplication();

        factory = await service.createFactory({
            height: parseInt(faker.random.numeric(5)),
            txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
            txTime: Math.floor(faker.date.recent().getTime() / 1000),
            sender: faker.finance.ethereumAddress(),
            address: faker.finance.ethereumAddress(),
            masterAddress: faker.finance.ethereumAddress(),
            kind: ContractType.unknown,
            chainId: 42161,
        });

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('factory', () => {
        it('should return an factory', async () => {
            const query = gql`
                query GetFactory($id: String!) {
                    factory(id: $id) {
                        id
                        chainId
                    }
                }
            `;

            const variables = {
                id: factory.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.factory.id).toEqual(factory.id);
                });
        });
    });

    describe('factories', () => {
        it('should get factory list', async () => {
            const factory2 = await service.createFactory({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                masterAddress: faker.finance.ethereumAddress(),
                kind: ContractType.unknown,
                chainId: 42161,
            });

            const query = gql`
                query GetFactories($chainId: Int!) {
                    factories(chainId: $chainId) {
                        id
                        chainId
                    }
                }
            `;

            const variables = {
                chainId: 42161,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.factories).toBeDefined();
                });
        });
    });
});
