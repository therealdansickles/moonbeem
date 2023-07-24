import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { Asset721Service } from './asset721.service';
import { INestApplication } from '@nestjs/common';

export const gql = String.raw;

describe('Asset721Resolver', () => {
    let service: Asset721Service;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.asset721Service;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('asset721', () => {
        it('should return an factory', async () => {
            const asset721 = await service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(5),
                owner: faker.finance.ethereumAddress(),
            });
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
