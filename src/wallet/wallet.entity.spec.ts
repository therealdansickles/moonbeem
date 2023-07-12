import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Wallet } from './wallet.entity';

describe('Wallet', () => {
    let repository: Repository<Wallet>;

    beforeAll(async () => {
        repository = global.walletRepository;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    it('should lowercase the address', async () => {
        let wallet = new Wallet();
        const address = faker.finance.ethereumAddress().toUpperCase();
        wallet.address = address;
        wallet.name = address.toLowerCase();
        await repository.save(wallet);
        wallet = await repository.findOneBy({ address: address.toLowerCase() });
        expect(wallet.address).toBe(address.toLowerCase());
    });
});
