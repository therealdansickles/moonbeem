import { faker } from '@faker-js/faker';
import { HttpService } from '@nestjs/axios';

import { SaleHistory } from '../saleHistory/saleHistory.dto';
import { generateAssetEvent } from '../saleHistory/saleHistory.service.spec';
import { OpenseaService } from './opensea.service';

describe('OpenseaService', () => {
    let service: OpenseaService;

    describe('#getCollectionStat', () => {
        beforeAll(async () => {
            const httpRequest = new HttpService();
            service = new OpenseaService(httpRequest);
        });

        it('should return the right response', async () => {
            const mockResponse = {
                supply: faker.datatype.float(),
                floorPrice: faker.datatype.float(),
                volume: {
                    hourly: faker.datatype.float(),
                    daily: faker.datatype.float(),
                    weekly: faker.datatype.float(),
                    total: faker.datatype.float(),
                },
                sales: {
                    hourly: faker.datatype.float(),
                    daily: faker.datatype.float(),
                    weekly: faker.datatype.float(),
                    total: faker.datatype.float(),
                    thirtyDayAvg: faker.datatype.float(),
                },
                netGrossEarning: faker.datatype.float(),
            };
            jest.spyOn(service, 'getCollectionStat').mockImplementation(async () => mockResponse);
            const result = await service.getCollectionStat('vibe-season-1-vibe-check');
            expect(result.supply).toBeTruthy();
            expect(result.floorPrice).toBeTruthy();
        });
    });

    describe('#getCollection', () => {
        beforeAll(async () => {
            const httpRequest = new HttpService();
            service = new OpenseaService(httpRequest);
        });

        it('should return the right response', async () => {
            const mockResponse = {
                volume: {
                    hourly: faker.datatype.float(),
                    daily: faker.datatype.float(),
                    weekly: faker.datatype.float(),
                    monthly: faker.datatype.float(),
                    total: faker.datatype.float(),
                },
                sales: {
                    hourly: faker.datatype.float(),
                    daily: faker.datatype.float(),
                    weekly: faker.datatype.float(),
                    monthly: faker.datatype.float(),
                    total: faker.datatype.float(),
                },
                price: {
                    hourly: faker.datatype.float(),
                    daily: faker.datatype.float(),
                    weekly: faker.datatype.float(),
                    monthly: faker.datatype.float(),
                },
                paymentToken: {
                    symbol: 'ETH',
                    priceInUSD: faker.datatype.float()
                },
                supply: faker.datatype.float(),
                floorPrice: faker.datatype.float(),
                netGrossEarning: faker.datatype.float(),
            };
            jest.spyOn(service, 'getCollection').mockImplementation(async () => mockResponse);
            const result = await service.getCollection('vibe-season-1-vibe-check');
            expect(result.volume).toBeTruthy();
            expect(result.paymentToken).toBeTruthy();
        });
    });
    
    describe('#getCollectionEvent', () => {
        beforeAll(async () => {
            const httpRequest = new HttpService();
            service = new OpenseaService(httpRequest);
        });

        it('should return the right response', async () => {
            const mockResponse = generateCustomEvent();

            jest.spyOn(service, 'getCollectionEvent').mockImplementation(async () => mockResponse);
            const result = await service.getCollectionEvent({
                asset_contract_address: `arb:${faker.finance.ethereumAddress()}`,
            });
            expect(result.asset_events).toBeTruthy();
        });
    });

    describe('#callOpenSea', () => {
        beforeAll(async () => {
            const httpRequest = new HttpService();
            service = new OpenseaService(httpRequest);
        });

        it('should ', async () => {
            const mockResponse = generateCustomEvent();
            for (let i = 0; i < 5; i++) {
                jest.spyOn(service, 'getCollectionEvent').mockImplementation(async () => mockResponse);
                const result = await service.getCollectionEvent({
                    asset_contract_address: `arb:${faker.finance.ethereumAddress()}`,
                });
                expect(result.asset_events).toBeTruthy();
            }
        });
    });
});

function generateCustomEvent(): SaleHistory {
    const asset_events = [generateAssetEvent()];
    const next = faker.finance.ethereumAddress();
    return { asset_events, next };
}
