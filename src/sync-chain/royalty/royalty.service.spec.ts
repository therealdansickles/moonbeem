import { RoyaltyService } from './royalty.service';
import { faker } from '@faker-js/faker';

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
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                userAddress: faker.finance.ethereumAddress(),
                userRate: faker.random.numeric(3),
            });

            const result = await service.getRoyalty(royalty.id);
            expect(result.id).toEqual(royalty.id);
        });
    });
});
