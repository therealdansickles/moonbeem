import { CoinMarketCapService } from './coinmarketcap.service';

describe('CoinMarketCapService', () => {
    let service: CoinMarketCapService;

    beforeAll(async () => {
        service = global.coinmarketcapService;
    });

    describe('getPriceFromCoinMarketCap', () => {
        it('should return the right response', async () => {
            const mockResponse = {
                USD: {
                    price: 1.23456789,
                },
            };

            jest.spyOn(service, 'getPrice').mockImplementation(async () => mockResponse);
            const result = await service.getPriceInUSD('USDT');
            expect(result.price).toBeTruthy();
        });

        it('should return the quote', async () => {
            const mockResponse = {
                USD: {
                    price: 1.23456789,
                },
            };

            jest.spyOn(service, 'getPrice').mockImplementation(async () => mockResponse);
            const result = await service.getPrice('USDT');
            expect(result.USD).toBeDefined();
            expect(result.USD.price).toBe(1.23456789);
        });
    });
});
