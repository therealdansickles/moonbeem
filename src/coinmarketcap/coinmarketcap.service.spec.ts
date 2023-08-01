import { CoinMarketCapService } from './coinmarketcap.service';

describe('CoinMarketCapService', () => {
    let service: CoinMarketCapService;

    beforeAll(async () => {
        service = global.coinmarketcapService;
    });

    describe('#getPrice', () => {
        it('should return the right response', async () => {
            const mockResponse = {
                status: {
                    timestamp: '2023-07-30T05:09:35.769Z',
                    error_code: 0,
                    error_message: null,
                    elapsed: 14,
                    credit_count: 1,
                    notice: null
                },
                data: [
                    {
                        id: 1,
                        symbol: 'BTC',
                        name: 'Bitcoin',
                        amount: 1,
                        last_updated: '2023-07-30T05:07:00.000Z',
                        quote: {
                            GBP: {
                                price: 284656.08465608465,
                                last_updated: '2018-06-06T06:00:00.000Z'
                            },
                            LTC: {
                                price: 3128.7279766396537,
                                last_updated: '2018-06-06T08:04:02.000Z'
                            },
                            USD: {
                                price: 381442,
                                last_updated: '2018-06-06T08:06:51.968Z'
                            }
                        }
                    }
                ]
            };

            jest.spyOn(service as any, 'callCoinMarketCap').mockImplementation(async () => mockResponse);
            const result = await service.getPrice('BTC');
            expect(result.USD?.price).toBeTruthy();
        });

        it('should works for cache machanism', async () => {
            const mockResponse = {
                status: {
                    timestamp: '2023-07-30T05:09:35.769Z',
                    error_code: 0,
                    error_message: null,
                    elapsed: 14,
                    credit_count: 1,
                    notice: null
                },
                data: [
                    {
                        id: 1,
                        symbol: 'BTC',
                        name: 'Bitcoin',
                        amount: 1,
                        last_updated: '2023-07-30T05:07:00.000Z',
                        quote: {
                            GBP: {
                                price: 284656.08465608465,
                                last_updated: '2018-06-06T06:00:00.000Z'
                            },
                            LTC: {
                                price: 3128.7279766396537,
                                last_updated: '2018-06-06T08:04:02.000Z'
                            },
                            USD: {
                                price: 381442,
                                last_updated: '2018-06-06T08:06:51.968Z'
                            }
                        }
                    }
                ]
            };

            jest.spyOn(service as any, 'callCoinMarketCap').mockImplementation(async () => mockResponse);
            const resultFromDb = await service.getPrice('BTC');
            const resultFromCache = await service.getPrice('BTC');
            expect(resultFromCache.USD.price).toEqual(mockResponse.data[0].quote.USD.price);
            expect(resultFromDb.USD.price).toEqual(resultFromCache.USD.price);
        });

        it('should return the quote', async () => {
            const mockResponse = {
                status: {
                    timestamp: '2023-07-30T05:09:35.769Z',
                    error_code: 0,
                    error_message: null,
                    elapsed: 14,
                    credit_count: 1,
                    notice: null
                },
                data: [
                    {
                        id: 1,
                        symbol: 'BTC',
                        name: 'Bitcoin',
                        amount: 1,
                        last_updated: '2023-07-30T05:07:00.000Z',
                        quote: {
                            GBP: {
                                price: 284656.08465608465,
                                last_updated: '2018-06-06T06:00:00.000Z'
                            },
                            LTC: {
                                price: 3128.7279766396537,
                                last_updated: '2018-06-06T08:04:02.000Z'
                            },
                            USD: {
                                price: 381442,
                                last_updated: '2018-06-06T08:06:51.968Z'
                            }
                        }
                    }
                ]
            };

            jest.spyOn(service as any, 'callCoinMarketCap').mockImplementation(async () => mockResponse);
            const result = await service.getPrice('BTC');
            expect(result.USD).toBeDefined();
            expect(result.USD.price).toBe(mockResponse.data[0].quote.USD.price);
        });
    });

    describe('#getPriceInUSD', () => {
        it('should return the right response', async () => {
            const mockResponse = {
                status: {
                    timestamp: '2023-07-30T05:09:35.769Z',
                    error_code: 0,
                    error_message: null,
                    elapsed: 14,
                    credit_count: 1,
                    notice: null
                },
                data: [
                    {
                        id: 1,
                        symbol: 'BTC',
                        name: 'Bitcoin',
                        amount: 1,
                        last_updated: '2023-07-30T05:07:00.000Z',
                        quote: {
                            GBP: {
                                price: 284656.08465608465,
                                last_updated: '2018-06-06T06:00:00.000Z'
                            },
                            LTC: {
                                price: 3128.7279766396537,
                                last_updated: '2018-06-06T08:04:02.000Z'
                            },
                            USD: {
                                price: 381442,
                                last_updated: '2018-06-06T08:06:51.968Z'
                            }
                        }
                    }
                ]
            };

            jest.spyOn(service as any, 'callCoinMarketCap').mockImplementation(async () => mockResponse);
            const result = await service.getPriceInUSD('BTC');
            expect(result.price).toEqual(mockResponse.data[0].quote.USD.price);
        });
    });
});
