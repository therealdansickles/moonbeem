import { faker } from '@faker-js/faker';
import { MintSaleTransactionService } from './mint-sale-transaction.service';

describe('MintSaleTransactionService', () => {
    let service: MintSaleTransactionService;

    beforeAll(async () => {
        service = global.mintSaleTransactionService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('MintSaleTransaction', () => {
        it('should get an transaction', async () => {
            const transaction = await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getMintSaleTransaction({ id: transaction.id });
            expect(result.id).toEqual(transaction.id);
        });
    });

    describe('Leaderboard', () => {
        it('should be return leaderboard', async () => {
            const contractAddress = faker.finance.ethereumAddress();
            const recipient1 = faker.finance.ethereumAddress();
            const recipient2 = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: contractAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: paymentToken,
            });
            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: contractAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: paymentToken,
            });
            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient2,
                address: contractAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: paymentToken,
            });

            const leaderboard = await service.getLeaderboard(contractAddress);
            expect(leaderboard[0].rank).toBeDefined();
            expect(leaderboard[0].rank).toBe('1'); // raw query with all fields as string
            expect(leaderboard[1].rank).toBeDefined();
            expect(leaderboard[1].rank).toBe('2'); // raw query with all fields as string
        });
    });
});
