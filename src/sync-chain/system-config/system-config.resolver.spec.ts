import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { SystemConfigModule } from './system-config.module';
import { SystemConfig } from './system-config.entity';
import { SystemConfigService } from './system-config.service';

export const gql = String.raw;

describe('SystemConfigResolver', () => {
    let repository: Repository<SystemConfig>;
    let service: SystemConfigService;
    let app: INestApplication;
    let cfg: SystemConfig;

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
                SystemConfigModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [SystemConfigModule],
                }),
            ],
        }).compile();

        repository = module.get('sync_chain_SystemConfigRepository');
        service = module.get<SystemConfigService>(SystemConfigService);
        app = module.createNestApplication();

        cfg = await service.createConfig({
            name: faker.company.name(),
            value: faker.random.numeric(5),
            kind: 'string',
            comment: 'The Config Comment',
        });

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('config', () => {
        it('should return config', async () => {
            const query = gql`
                query GetConfig($id: String!) {
                    config(id: $id) {
                        id
                    }
                }
            `;

            const variables = {
                id: cfg.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.config.id).toEqual(cfg.id);
                });
        });
    });

    describe('getSystemConfigs', () => {
        it('should be return config list', async () => {
            const query = gql`
                query GetConfigs($chainId: Int) {
                    configs(chainId: $chainId) {
                        id
                    }
                }
            `;

            const variables = {};

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.configs).toBeDefined();
                });
        });
    });
});
