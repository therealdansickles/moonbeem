import { faker } from '@faker-js/faker';
import { History721Type } from './history721.entity';
import { History721Service } from './history721.service';

describe('History721Service', () => {
    let service: History721Service;

    beforeAll(async () => {
        service = global.history721Service;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('history721', () => {
        it('should get an nft history', async () => {
            const history = await service.createHistory721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(5),
                sender: faker.finance.ethereumAddress(),
                receiver: faker.finance.ethereumAddress(),
                kind: History721Type.unknown,
            });

            const result = await service.getHistory721(history.id);
            expect(result.id).toEqual(history.id);
        });
    });
});
