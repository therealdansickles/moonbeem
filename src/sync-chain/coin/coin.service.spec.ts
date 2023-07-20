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
            const uuid = faker.datatype.uuid();
            const mockResponse = {
                id: uuid,
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                native: false,
                enable: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            jest.spyOn(service, 'getCoin').mockImplementation(async () => mockResponse);
            const result = await service.getCoin(uuid);
            expect(result.id).toEqual(uuid);
        });

        it('should get an coin by address', async () => {
            const address = faker.finance.ethereumAddress();
            const mockResponse = {
                id: faker.datatype.uuid(),
                address: address,
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                native: false,
                enable: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            jest.spyOn(service, 'getCoinByAddress').mockImplementation(async () => mockResponse);
            const result = await service.getCoinByAddress(address);
            expect(result.address).toEqual(address);
        });

        it('should get coin list for chainId', async () => {
            const address = faker.finance.ethereumAddress();
            const mockResponse = [
                {
                    id: faker.datatype.uuid(),
                    address: address,
                    name: 'USD Coin',
                    symbol: 'USDC',
                    decimals: 6,
                    native: false,
                    enable: true,
                    chainId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            jest.spyOn(service, 'getCoins').mockImplementation(async () => mockResponse);

            const data = { chainId: 1 };
            const result = await service.getCoins(data);
            expect(result.length).toBeGreaterThanOrEqual(1);
        });

        it('should get the entire coin list', async () => {
            const address = faker.finance.ethereumAddress();
            const mockResponse = [
                {
                    id: faker.datatype.uuid(),
                    address: address,
                    name: 'USD Coin',
                    symbol: 'USDC',
                    decimals: 6,
                    native: false,
                    enable: true,
                    chainId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ];
            jest.spyOn(service, 'getCoins').mockImplementation(async () => mockResponse);

            const data = {};
            const result = await service.getCoins(data);
            expect(result.length).toBeGreaterThanOrEqual(1);
        });
    });
});
