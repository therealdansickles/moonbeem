import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { RoyaltyService } from './royalty.service';

export const gql = String.raw;

describe('RoyaltyResolver', () => {
    let service: RoyaltyService;
    let app: INestApplication;

    beforeEach(async () => {
        app = global.app;
        service = global.royaltyService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('royalty', () => {
        it('should return an factory', async () => {
            const royalty = await service.createRoyalty({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                userAddress: faker.finance.ethereumAddress(),
                userRate: faker.string.numeric(3),
            });

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
