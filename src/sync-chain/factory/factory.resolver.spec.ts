import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { ContractType } from './factory.entity';
import { FactoryService } from './factory.service';

export const gql = String.raw;

describe('FactoryResolver', () => {
    let service: FactoryService;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.factoryService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('factory', () => {
        it('should return an factory', async () => {
            const factory = await service.createFactory({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                masterAddress: faker.finance.ethereumAddress(),
                kind: ContractType.unknown,
                chainId: 42161,
            });

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
            await service.createFactory({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
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
