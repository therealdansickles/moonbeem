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
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
            });

            const result = await service.getCoin(coin.id);
            expect(result.id).toEqual(coin.id);
        });

        it('should get an coin by address', async () => {
            const coin = await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
            });

            const result = await service.getCoinByAddress(coin.address);
            expect(result.id).toEqual(coin.id);
        });

        it('should get coin list for chainId', async () => {
            await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
            });

            const data = { chainId: 1 };
            const result = await service.getCoins(data);
            expect(result.length).toBeGreaterThanOrEqual(1);
        });

        it('should get the entire coin list', async () => {
            await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
            });

            const data = { chainId: 0 };
            const result = await service.getCoins(data);
            expect(result.length).toBeGreaterThanOrEqual(1);
        });
    });
});
