import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { History721Type } from './history721.entity';
import { History721Service } from './history721.service';

export const gql = String.raw;

describe('History721Resolver', () => {
    let service: History721Service;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.history721Service;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('history721', () => {
        it('should get an nft history', async () => {
            const history = await service.createHistory721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                sender: faker.finance.ethereumAddress(),
                receiver: faker.finance.ethereumAddress(),
                kind: History721Type.unknown,
            });
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
