import { HttpService } from '@nestjs/axios';
import { CoinMarketCapService } from './coinmarketcap.service';

describe('CoinMarketCapService', () => {
    let service: CoinMarketCapService;

    beforeAll(async () => {
        const httpRequest = new HttpService();
        service = new CoinMarketCapService(httpRequest);
    });

    describe('getPriceFromCoinMarketCap', () => {
        it('should return the right response', async () => {
            const mockResponse = {
                price: 1.23456789,
            };

            jest.spyOn(service, 'getPriceInUSD').mockImplementation(async () => mockResponse);
            const result = await service.getPriceInUSD('USDT');
            expect(result.price).toBeTruthy();
        });
    });
});
