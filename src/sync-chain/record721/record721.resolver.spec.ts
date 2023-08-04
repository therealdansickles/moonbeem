import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { Record721Service } from './record721.service';

export const gql = String.raw;

describe('Record721Resolver', () => {
    let service: Record721Service;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.record721Service;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('erc721 record', () => {
        it('should return contract info', async () => {
            const record = await service.createRecord721({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                name: 'USC Coin',
                symbol: 'USDC',
                baseUri: 'https://',
                owner: faker.finance.ethereumAddress(),
            });

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
