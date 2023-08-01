import { startOfDay, startOfMonth, startOfWeek } from 'date-fns';

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

    describe('getMonthlyBuyersByCollectionAddresses', () => {
        it('should be return the number of unique buyers', async () => {
            const collectionAddress = faker.finance.ethereumAddress();
            const recipient1 = faker.finance.ethereumAddress();

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collectionAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            // the same recipient
            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collectionAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getBuyersByCollectionAddressesAndBeginTime(
                [collectionAddress],
                startOfMonth(new Date())
            );
            expect(result).toBe(2);

            const result1 = await service.getBuyersByCollectionAddressesAndBeginTime(
                [collectionAddress],
                startOfWeek(new Date())
            );
            expect(result1).toBe(2);

            const result2 = await service.getBuyersByCollectionAddressesAndBeginTime(
                [collectionAddress],
                startOfDay(new Date())
            );
            expect(result2).toBe(2);
        });

        it("should be returned to this month's buyers", async () => {
            const collectionAddress = faker.finance.ethereumAddress();
            const month = new Date().getMonth();

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            // two months before this month
            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().setMonth(month - 2) / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getBuyersByCollectionAddressesAndBeginTime(
                [collectionAddress],
                startOfMonth(new Date())
            );
            expect(result).toBe(2);

            const result1 = await service.getBuyersByCollectionAddressesAndBeginTime(
                [collectionAddress],
                startOfWeek(new Date())
            );
            expect(result1).toBe(2);

            const result2 = await service.getBuyersByCollectionAddressesAndBeginTime(
                [collectionAddress],
                startOfDay(new Date())
            );
            expect(result2).toBe(2);
        });

        it('should be return the number of unique buyers, multiple address', async () => {
            const collectionAddress1 = faker.finance.ethereumAddress();
            const collectionAddress2 = faker.finance.ethereumAddress();

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress1,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress2,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getBuyersByCollectionAddressesAndBeginTime(
                [collectionAddress1, collectionAddress2],
                startOfMonth(new Date())
            );
            expect(result).toBe(2);
        });
    });

    describe('getEarningsByCollectionAddressesAndBeginTime', () => {
        it('should return monthly earnings', async () => {
            const collectionAddress = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            const result = await service.getEarningsByCollectionAddressesAndBeginTime(
                [collectionAddress],
                startOfMonth(new Date())
            );
            expect(result).toBeDefined();
            expect(result.length).toBe(1);
            expect(result[0].token).toBe(paymentToken);
            expect(result[0].totalPrice).toBe(2000000000000000000);
        });

        it('should return monthly earnings, multiple collections', async () => {
            const collectionAddress1 = faker.finance.ethereumAddress();
            const collectionAddress2 = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress1,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress1,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress2,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            const result = await service.getEarningsByCollectionAddressesAndBeginTime(
                [collectionAddress1, collectionAddress2],
                startOfMonth(new Date())
            );
            expect(result).toBeDefined();
            expect(result.length).toBe(1);
        });

        it('should return number of earnings on this month', async () => {
            const collectionAddress1 = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();
            const month = new Date().getMonth();

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress1,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress1,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            // two months before this month
            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().setMonth(month - 2) / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress1,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            const result = await service.getEarningsByCollectionAddressesAndBeginTime(
                [collectionAddress1],
                startOfMonth(new Date())
            );
            expect(result).toBeDefined();
            expect(result.length).toBe(1);
            expect(result[0].token).toBe(paymentToken);
            expect(result[0].totalPrice).toBe(2000000000000000000);
        });
    });

    describe('getTotalSalesByCollectionAddresses', () => {
        it('should be return total prices by collections', async () => {
            const collectionAddress1 = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress1,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress1,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            const result = await service.getTotalSalesByCollectionAddresses([collectionAddress1]);
            expect(result.length).toBe(1);
            expect(result[0].token).toBe(paymentToken);
            expect(result[0].totalPrice).toBe(2000000000000000000);
        });

        it('shoule be return total prices by collection, multiple payment tokens and multiple collections', async () => {
            const collectionAddress1 = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress1,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '1000000000000000000',
                paymentToken: paymentToken,
            });

            const collectionAddress2 = faker.finance.ethereumAddress();
            const paymentToken2 = faker.finance.ethereumAddress();
            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress2,
                tierId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: '2000000000000000000',
                paymentToken: paymentToken2,
            });

            const result = await service.getTotalSalesByCollectionAddresses([collectionAddress1, collectionAddress2]);
            expect(result.length).toBe(2);

            const filter1 = result.filter((item) => {
                return item.token == paymentToken;
            });
            expect(filter1).toBeDefined();
            expect(filter1.length).toBe(1);
            expect(filter1[0].totalPrice).toBe(1000000000000000000);

            const filter2 = result.filter((item) => {
                return item.token == paymentToken2;
            });
            expect(filter2).toBeDefined();
            expect(filter2.length).toBe(1);
            expect(filter2[0].totalPrice).toBe(2000000000000000000);
        });
    });

    describe('getAggregatedCollectionTransaction', () => {
        it('should return aggregated collection transaction with minted NFT items', async () => {
            const collectionAddress = faker.finance.ethereumAddress();
            const tokenAddress = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();

            const transactionContent = {
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 0,
                tokenAddress,
                paymentToken: paymentToken,
            };

            // minted 3 in one transaction
            const tnx1 = await service.createMintSaleTransaction({
                tokenId: faker.random.numeric(1),
                price: '1000000000000000000',
                ...transactionContent,
            });

            const tnx2 = await service.createMintSaleTransaction({
                tokenId: faker.random.numeric(2),
                price: '2000000000000000000',
                ...transactionContent,
            });

            const tnx3 = await service.createMintSaleTransaction({
                tokenId: faker.random.numeric(3),
                price: '3000000000000000000',
                ...transactionContent,
            });

            // another transaction
            const tnx4 = await service.createMintSaleTransaction({
                tokenId: faker.random.numeric(4),
                price: '4000000000000000000',
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 1,
                tokenAddress,
                paymentToken,
            });

            const result = await service.getAggregatedCollectionTransaction(collectionAddress);

            expect(result).toBeDefined();
            expect(result.length).toEqual(2);
            result.sort((a, b) => b.cost - a.cost); // It needs to be sorted first, otherwise the order in the array may be messed up, resulting in test failure.
            expect(result[0].cost.toString()).toEqual(
                (BigInt(tnx1.price) + BigInt(tnx2.price) + BigInt(tnx3.price)).toString()
            );
            expect(result[1].cost.toString()).toEqual(tnx4.price.toString());
        });

        it('should not accumulate the different token even they are in the same transaction', async () => {
            const collectionAddress = faker.finance.ethereumAddress();
            const tokenAddress = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();

            const transactionContent = {
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collectionAddress,
                tierId: 0,
                tokenAddress,
                paymentToken: paymentToken,
            };

            // minted 3 in one transaction
            await service.createMintSaleTransaction({
                tokenId: faker.random.numeric(1),
                price: '1000000000000000000',
                ...transactionContent,
            });

            await service.createMintSaleTransaction({
                tokenId: faker.random.numeric(2),
                price: '2000000000000000000',
                ...transactionContent,
            });

            await service.createMintSaleTransaction({
                tokenId: faker.random.numeric(3),
                price: '3000000000000000000',
                ...transactionContent,
            });

            // another contract
            await service.createMintSaleTransaction({
                tokenId: faker.random.numeric(4),
                price: '4000000000000000000',
                ...transactionContent,
                tokenAddress: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
            });

            const result = await service.getAggregatedCollectionTransaction(collectionAddress);

            expect(result).toBeDefined();
            expect(result.length).toEqual(1);
        });
    });
});
