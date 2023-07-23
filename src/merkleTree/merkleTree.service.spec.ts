import { faker } from '@faker-js/faker';
import { MerkleTreeService } from './merkleTree.service';

describe('MerkleTreeService', () => {
    let service: MerkleTreeService;

    beforeAll(async () => {
        service = global.merkleTreeService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        (await global.gc) && (await global.gc());
    });

    describe('createMerkleTree', () => {
        it('should create a merkle tree', async () => {
            const merkleTree = await service.createMerkleTree({
                data: [
                    {
                        address: faker.finance.ethereumAddress(),
                        amount: faker.random.numeric(2),
                    },
                ],
            });

            expect(merkleTree).toBeDefined();
        });

        it('should get merkle data', async () => {
            const merkleTree = await service.createMerkleTree({
                data: [
                    {
                        address: faker.finance.ethereumAddress(),
                        amount: faker.random.numeric(2),
                    },
                ],
            });

            const result = await service.getMerkleTree(merkleTree.merkleRoot);
            expect(result.merkleRoot).toBe(merkleTree.merkleRoot);
            expect(result.data.length).toBe(1);
        });

        it('should get merkle proof', async () => {
            const address = faker.finance.ethereumAddress();
            const amount = faker.random.numeric(2);
            const merkleTree = await service.createMerkleTree({
                data: [
                    {
                        address: faker.finance.ethereumAddress(),
                        amount: faker.random.numeric(2),
                    },
                    {
                        address: address,
                        amount: amount,
                    },
                ],
            });

            const result = await service.getMerkleProof(address, merkleTree.merkleRoot);
            expect(result).toBeDefined();
            expect(result.address).toBe(address);
            expect(result.amount).toBe(amount);
        });

        it('should be fail, if no whitelist address', async () => {
            try {
                await service.createMerkleTree({ data: [] });
            } catch (error) {
                expect(error.message).toMatch(/The length of data cannot be 0./);
            }
        });

        it('should be fail, if merkleRoot does not match', async () => {
            const address = faker.finance.ethereumAddress();
            const amount = faker.random.numeric(2);
            await service.createMerkleTree({
                data: [
                    {
                        address: faker.finance.ethereumAddress(),
                        amount: faker.random.numeric(2),
                    },
                    {
                        address: address,
                        amount: amount,
                    },
                ],
            });

            try {
                await service.getMerkleProof(address, faker.datatype.hexadecimal({ length: 66 }));
            } catch (error) {
                expect(error.message).toMatch(/Invalid Merkle Tree/);
            }
        });
    });
});
