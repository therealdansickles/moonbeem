import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { MerkleTreeService } from './merkleTree.service';
import { MerkleTreeType } from './merkleTree.dto';

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
            const amount = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const merkleTree = await service.createMerkleTree({
                data: [
                    {
                        address: faker.finance.ethereumAddress(),
                        amount: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
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

        it('should return merkleTree', async () => {
            const address = faker.finance.ethereumAddress();
            const amount = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const merkleTree = await service.createMerkleTree({
                data: [
                    {
                        address: faker.finance.ethereumAddress(),
                        amount: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                    },
                    {
                        address: address,
                        amount: amount,
                    },
                ],
            });

            const query = gql`
                query GetMerkleTree($merkleRoot: String) {
                    merkleTree(merkleRoot: $merkleRoot) {
                        data
                        merkleRoot
                        __typename
                    }
                }
            `;
            const variables = { merkleRoot: merkleTree.merkleRoot };
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.merkleTree.data.length).toBe(2);
                    expect(body.data.merkleTree.data[0].address).toBeDefined();
                    expect(body.data.merkleTree.data[0].amount).toBeDefined();
                });
        });

        it('should return null, if not merkleRoot provide', async () => {
            const query = gql`
                query GetMerkleTree($merkleRoot: String) {
                    merkleTree(merkleRoot: $merkleRoot) {
                        data
                        merkleRoot
                        __typename
                    }
                }
            `;
            const variables = {};
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.merkleTree).toBeNull();
                });
        });
    });

    describe('GeneralMerkleTree', () => {
        it('should create merkle tree', async () => {
            const type = MerkleTreeType.recipients;
            const data = [
                {
                    collection: faker.finance.ethereumAddress(),
                    tokenId: faker.number.int({ max: 1000, min: 1 }),
                    quantity: faker.number.int({ max: 1000, min: 1 }),
                },
            ];
            const input = {
                type,
                data,
            };

            const query = gql`
                mutation CreateGeneralMerkleTree($input: CreateGeneralMerkleRootInput!) {
                    createGeneralMerkleTree(input: $input) {
                        merkleRoot
                    }
                }
            `;
            const variables = { input };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createGeneralMerkleTree).toBeDefined();
                    expect(body.data.createGeneralMerkleTree.merkleRoot).toBeDefined();
                });
        });

        it('should get merkle tree proof', async () => {
            const type = MerkleTreeType.recipients;
            const collection = faker.finance.ethereumAddress();
            const leafData = {
                collection,
                tokenId: faker.number.int({ max: 1000, min: 1 }),
                quantity: faker.number.int({ max: 1000, min: 1 }),
            };
            const data = [
                leafData,
                {
                    collection,
                    tokenId: faker.number.int({ max: 1000, min: 1 }),
                    quantity: faker.number.int({ max: 1000, min: 1 }),
                },
                {
                    collection,
                    tokenId: faker.number.int({ max: 1000, min: 1 }),
                    quantity: faker.number.int({ max: 1000, min: 1 }),
                },
            ];

            const merkleTree = await service.createGeneralMerkleTree(type, data);
            const merkleRoot = merkleTree.merkleRoot;
            const input = {
                merkleRoot,
                type,
                leafData,
            };

            const query = gql`
                query GetGeneralMerkleProof($input: GetGeneralMerkleProofInput!) {
                    getGeneralMerkleProof(input: $input) {
                        proof
                    }
                }
            `;
            const variables = { input };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.getGeneralMerkleProof).toBeDefined();
                    expect(body.data.getGeneralMerkleProof.proof).not.toEqual([]);
                });
        });
    });
});
