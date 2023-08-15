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
                        amount: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
                    },
                ],
            });

            const result = await service.getMerkleTree(merkleTree.merkleRoot);

            expect(merkleTree).toBeDefined();
            expect(result).toBeDefined();
            expect(result.id).toBe(merkleTree.id);
        });

        it('should return the same merkle tree, if data is the same.', async () => {
            const address = faker.finance.ethereumAddress();
            const amount = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const merkleTree = await service.createMerkleTree({
                data: [{ address, amount }],
            });

            const reCreate = await service.createMerkleTree({
                data: [{ address, amount }],
            });

            expect(merkleTree.id).toBe(reCreate.id);
        });

        it('should throw an error, if data is empty', async () => {
            try {
                await service.createMerkleTree({ data: [] });
            } catch (error) {
                expect(error.message).toMatch(/The length of data cannot be 0./);
            }
        });
    });

    describe('getMerkleProof', () => {
        it('should get merkle proof, single address', async () => {
            const address = faker.finance.ethereumAddress();
            const amount = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const merkleTree = await service.createMerkleTree({
                data: [{ address, amount }],
            });

            const result = await service.getMerkleProof(address, merkleTree.merkleRoot);
            expect(result.address).toBe(address.toLowerCase());
            expect(result.amount).toBe(amount);
            expect(result.proof).toBeDefined();
            expect(result.proof).toEqual([]);
        });

        it('should get merkle proof, multiple addresses', async () => {
            const address = faker.finance.ethereumAddress();
            const amount = faker.string.numeric({ length: 2, allowLeadingZeros: false });

            const address1 = faker.finance.ethereumAddress();
            const amount1 = faker.string.numeric({ length: 2, allowLeadingZeros: false });

            const merkleTree = await service.createMerkleTree({
                data: [
                    { address, amount },
                    { address: address1, amount: amount1 },
                ],
            });

            const result = await service.getMerkleProof(address, merkleTree.merkleRoot);
            expect(result.address).toBe(address.toLowerCase());
            expect(result.amount).toBe(amount);
            expect(result.proof).toBeDefined();

            const result1 = await service.getMerkleProof(address1, merkleTree.merkleRoot);
            expect(result1.address).toBe(address1.toLowerCase());
            expect(result1.amount).toBe(amount1);
            expect(result1.proof).toBeDefined();
        });

        it('should return null, if merklet root not match', async () => {
            const result = await service.getMerkleProof(
                faker.finance.ethereumAddress(),
                faker.string.hexadecimal({ length: 66 })
            );
            expect(result).toBeUndefined();
        });

        it('should return null, if you are not allowlist', async () => {
            const address = faker.finance.ethereumAddress();
            const amount = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            const merkleTree = await service.createMerkleTree({
                data: [{ address, amount }],
            });

            const result = await service.getMerkleProof(faker.finance.ethereumAddress(), merkleTree.merkleRoot);
            expect(result).toBeUndefined();
        });

        it('should return usable equal -1', async () => {
            const address = faker.finance.ethereumAddress();
            const amount = faker.string.numeric({ length: 2, allowLeadingZeros: false });

            const address1 = faker.finance.ethereumAddress();
            const amount1 = faker.string.numeric({ length: 2, allowLeadingZeros: false });

            const merkleTree = await service.createMerkleTree({
                data: [
                    { address, amount },
                    { address: address1, amount: amount1 },
                ],
            });

            const result = await service.getMerkleProof(
                address,
                merkleTree.merkleRoot,
                faker.finance.ethereumAddress()
            );
            expect(result.usable).toEqual(-1);
        });
    });
});
