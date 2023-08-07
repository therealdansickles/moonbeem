import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { MintSaleContractService } from './mint-sale-contract.service';

export const gql = String.raw;

describe('MintSaleContractResolver', () => {
    let service: MintSaleContractService;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.mintSaleContractService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('MintSaleContract', () => {
        it('should return an contract', async () => {
            const contract = await service.createMintSaleContract({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            const query = gql`
                query GetMintSaleContract($id: String!) {
                    mintSaleContract(id: $id) {
                        id
                        chainId
                    }
                }
            `;

            const variables = {
                id: contract.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.mintSaleContract.id).toEqual(contract.id);
                });
        });
    });
});
