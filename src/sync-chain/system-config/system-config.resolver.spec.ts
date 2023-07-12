import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';

export const gql = String.raw;

describe('SystemConfigResolver', () => {
    let service: SystemConfigService;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.systemConfigService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('config', () => {
        it('should return config', async () => {
            const cfg = await service.createConfig({
                name: faker.company.name(),
                value: faker.random.numeric(5),
                kind: 'string',
                comment: 'The Config Comment',
            });

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
            await service.createConfig({
                name: faker.company.name(),
                value: faker.random.numeric(5),
                kind: 'string',
                comment: 'The Config Comment',
            });

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
