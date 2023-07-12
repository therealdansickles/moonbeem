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
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
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
                price: faker.random.numeric(19),
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

    describe('MetkleTree', () => {
        const amount = faker.random.numeric(3);
        const address = faker.finance.ethereumAddress();
        let merkleRoot = '';
        it('should create merkle tree', async () => {
            const query = gql`
                mutation CreateMerkleRoot($input: CreateMerkleRootInput!) {
                    createMerkleRoot(input: $input) {
                        success
                        merkleRoot
                    }
                }
            `;
            const variables = {
                input: {
                    data: [{ address: address, amount: amount }],
                },
            };
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    merkleRoot = body.data.createMerkleRoot.merkleRoot;
                    expect(body.data.createMerkleRoot.merkleRoot).toBeDefined();
                });
        });

        it('should create merkle tree', async () => {
            const query = gql`
                query GetMerkleProof($address: String!, $merkleRoot: String!) {
                    getMerkleProof(address: $address, merkleRoot: $merkleRoot) {
                        address
                        amount
                        proof
                        success
                    }
                }
            `;
            const variables = {
                address: address,
                merkleRoot: merkleRoot,
            };
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const result = body.data.getMerkleProof;
                    expect(result).toBeDefined();
                    expect(result.address.toLowerCase()).toBe(address.toLowerCase());
                    expect(result.amount).toBe(amount);
                    expect(result.proof).toBeDefined();
                });
        });
    });
});
