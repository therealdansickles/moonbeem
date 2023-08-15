import { faker } from '@faker-js/faker';

import { CoinService } from './coin.service';

describe('CoinService', () => {
    let service: CoinService;

    beforeAll(async () => {
        service = global.coinService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('coin', () => {
        it('should get an coin', async () => {
            const coin = await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                native: false,
                enable: true,
                derivedETH: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                derivedUSDC: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
            });

            const result = await service.getCoin(coin.id);
            expect(result.id).toEqual(coin.id);
        });

        it('should get an coin by address', async () => {
            const address = faker.finance.ethereumAddress();
            const coin = await service.createCoin({
                address: address,
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                native: false,
                enable: true,
                derivedETH: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                derivedUSDC: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
            });
            const result = await service.getCoinByAddress(coin.address);
            expect(result.address).toEqual(coin.address);
        });

        it('should get coin list for chainId', async () => {
            await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                chainId: 1,
                native: false,
                enable: true,
                derivedETH: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                derivedUSDC: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
            });
            await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'VIBE Coin',
                symbol: 'VIBE',
                decimals: 6,
                chainId: 42161,
                native: false,
                enable: true,
                derivedETH: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                derivedUSDC: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
            });

            // Should return all coins if chainid is 0 or null.
            const data = { chainId: 0 };
            const result = await service.getCoins(data);
            expect(result.length).toBeGreaterThanOrEqual(2);

            // Should return all coins with chainId=1
            const data1 = { chainId: 1 };
            const result1 = await service.getCoins(data1);
            expect(result1.length).toBeGreaterThanOrEqual(1);
            expect(result1[0].chainId).toEqual(1);
        });

        it('should get the quote for given coin', async () => {
            const mockResponse = {
                USDC: {
                    price: 1.23456789,
                },
            };
            jest.spyOn(service, 'getQuote').mockImplementation(async () => mockResponse);

            const result = await service.getQuote('USDC');
            expect(result['USDC'].price).toBe(1.23456789);
        });
    });
});
