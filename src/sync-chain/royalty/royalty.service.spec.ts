import { faker } from '@faker-js/faker';

import { RoyaltyService } from './royalty.service';

describe('RoyaltyService', () => {
    let service: RoyaltyService;

    beforeEach(async () => {
        service = global.royaltyService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getRoyalty', () => {
        it('should get an royalty', async () => {
            const royalty = await service.createRoyalty({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                userAddress: faker.finance.ethereumAddress(),
                userRate: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
            });

            const result = await service.getRoyalty(royalty.id);
            expect(result.id).toEqual(royalty.id);
        });
    });
});
