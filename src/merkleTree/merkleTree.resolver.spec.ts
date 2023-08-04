import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { MerkleTreeService } from './merkleTree.service';

export const gql = String.raw;

describe('MerkleTreeResolver', () => {
    let service: MerkleTreeService;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.merkleTreeService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('MerkleTree', () => {
        it('should get merkle proof', async () => {
            const address = faker.finance.ethereumAddress();
            const amount = faker.string.numeric(2);
            const merkleTree = await service.createMerkleTree({
                data: [
                    {
                        address: faker.finance.ethereumAddress(),
                        amount: faker.string.numeric(2),
                    },
                    {
                        address: address,
                        amount: amount,
                    },
                ],
            });

            const query = gql`
                query MerkleProof($address: String!, $merkleRoot: String!) {
                    merkleProof(address: $address, merkleRoot: $merkleRoot) {
                        address
                        amount
                        proof
                    }
                }
            `;
            const variables = { address: address, merkleRoot: merkleTree.merkleRoot };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.merkleProof).toBeDefined();
                    expect(body.data.merkleProof.address).toBe(address);
                    expect(body.data.merkleProof.amount).toBe(amount);
                });
        });
    });
});
