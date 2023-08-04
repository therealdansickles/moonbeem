import { faker } from '@faker-js/faker';

import { SaleHistory } from '../saleHistory/saleHistory.dto';
import { generateAssetEvent } from '../saleHistory/saleHistory.service.spec';
import { OpenseaService } from './opensea.service';

describe('OpenseaService', () => {
    let service: OpenseaService;
    beforeAll(async () => {
        service = global.openseaService;
    });

    describe('#getCollectionStat', () => {
        it('should return the right response', async () => {
            const mockResponse = {
                supply: faker.number.float(),
                floorPrice: faker.number.float(),
                volume: {
                    hourly: faker.number.float(),
                    daily: faker.number.float(),
                    weekly: faker.number.float(),
                    total: faker.number.float(),
                },
                sales: {
                    hourly: faker.number.float(),
                    daily: faker.number.float(),
                    weekly: faker.number.float(),
                    total: faker.number.float(),
                    thirtyDayAvg: faker.number.float(),
                },
                netGrossEarning: faker.number.float(),
            };
            jest.spyOn(service, 'getCollectionStat').mockImplementation(async () => mockResponse);
            const result = await service.getCollectionStat('vibe-season-1-vibe-check');
            expect(result.supply).toBeTruthy();
            expect(result.floorPrice).toBeTruthy();
        });
    });

    describe('#getCollection', () => {
        it('should return the right response', async () => {
            const mockResponse = {
                volume: {
                    hourly: faker.number.float(),
                    daily: faker.number.float(),
                    weekly: faker.number.float(),
                    monthly: faker.number.float(),
                    total: faker.number.float(),
                },
                sales: {
                    hourly: faker.number.float(),
                    daily: faker.number.float(),
                    weekly: faker.number.float(),
                    monthly: faker.number.float(),
                    total: faker.number.float(),
                },
                price: {
                    hourly: faker.number.float(),
                    daily: faker.number.float(),
                    weekly: faker.number.float(),
                    monthly: faker.number.float(),
                },
                paymentToken: {
                    symbol: 'ETH',
                    priceInUSD: faker.number.float()
                },
                supply: faker.number.float(),
                floorPrice: faker.number.float(),
                netGrossEarning: faker.number.float(),
            };
            jest.spyOn(service, 'getCollection').mockImplementation(async () => mockResponse);
            const result = await service.getCollection('vibe-season-1-vibe-check');
            expect(result.volume).toBeTruthy();
            expect(result.paymentToken).toBeTruthy();
        });
    });
    
    describe('#getCollectionEvent', () => {
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
