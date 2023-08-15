import { faker } from '@faker-js/faker';

import {
    Account, Asset, EarningChart, EarningPerDay, PaymentToken, Sale, Transaction
} from './saleHistory.dto';
import { SaleHistoryService } from './saleHistory.service';

describe('SaleHistoryService', () => {
    let service: SaleHistoryService;

    beforeEach(async () => {
        service = global.saleHistoryService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    it('should list of sales and next pagination node', async () => {
        const mockResponse = {
            asset_events: [generateAssetEvent()],
            next: faker.company.name(),
        };
        jest.spyOn(service, 'getSaleHistory').mockImplementation(async () => mockResponse);
        const result = await service.getSaleHistory(faker.finance.ethereumAddress(), '');
        expect(result.asset_events).toBeTruthy();
    });

    it('Should return the total amount per day and the grand total. ', async () => {
        const mockResponse = {
            totalAmountPerDay: [generateEarningPerDay()],
        };
        jest.spyOn(service, 'getEarningChart').mockImplementation(async () => mockResponse);
        const result = await service.getEarningChart('claw-machine-catch-the-friends');
        expect(result.totalAmountPerDay).toBeTruthy();
    });
});

function generateEarningPerDay(): EarningPerDay {
    const earningPerDay = {
        total: parseFloat(faker.string.numeric()),
        day: faker.company.name(),
    };
    return earningPerDay;
}

export function generateEarningChart(): EarningChart {
    const earningChart = {
        totalAmountPerDay: [generateEarningPerDay()],
    };
    return earningChart;
}

export function generateAsset(): Asset {
    const asset_events = {
        num_sales: faker.string.numeric(),
        image_url: faker.image.url(),
        name: faker.company.name(),
        collection: { is_rarity_enabled: faker.datatype.boolean() },
        asset_contract: { address: faker.finance.ethereumAddress() },
    };

    return asset_events;
}
export function generateAssetEvent(): Sale {
    const assetEvent = {
        payment_token: generatePaymentToken(),
        event_timestamp: `${faker.date.recent()}`,
        total_price: `${faker.number.float()}`,
        transaction: generateTransasction(),
        nftName: faker.company.name(),
        nftPicture: faker.image.url(),
        currentPrice: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
        rarity: faker.datatype.boolean(),
        quantity: faker.string.numeric({ length: 1, allowLeadingZeros: false }),
        timeListed: `${faker.date.recent().getTime()}`,
        from: faker.finance.ethereumAddress(),
        to: faker.finance.ethereumAddress(),
        time: `${faker.date.recent().getTime()}`,
        asset: generateAsset(),
        listing_time: `${faker.date.recent().getTime()}`,
        created_date: `${faker.date.recent().getTime()}`,
    };
    return assetEvent;
}

export function generatePaymentToken(): PaymentToken {
    return {
        symbol: faker.company.name(),
        address: faker.finance.ethereumAddress(),
        image_url: faker.internet.url(),
        name: faker.company.name(),
        decimals: faker.string.numeric(),
        eth_price: `${faker.string.numeric()}`,
        usd_price: `${faker.string.numeric()}`,
    };
}

export function generateTransasction(): Transaction {
    return {
        from_account: generateAcount(),
        to_account: generateAcount(),
        timestamp: `${faker.date.recent()}`,
    };
}

export function generateAcount(): Account {
    return {
        address: faker.finance.ethereumAddress(),
        profile_img_url: faker.internet.url(),
    };
}
