import { faker } from '@faker-js/faker';
import { Record721Service } from './record721.service';

describe('Record721Service', () => {
    let service: Record721Service;

    beforeAll(async () => {
        service = global.record721Service;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('erc721 record', () => {
        it('should get an contract', async () => {
            const record = await service.createRecord721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                name: 'USC Coin',
                symbol: 'USDC',
                baseUri: 'https://',
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getRecord721(record.id);
            expect(result.id).toEqual(record.id);
        });
    });
});
