import { faker } from '@faker-js/faker';

import { ContractType } from './factory.entity';
import { FactoryService } from './factory.service';

describe('FactoryService', () => {
    let service: FactoryService;

    beforeAll(async () => {
        service = global.factoryService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getFactory', () => {
        it('should get an factory', async () => {
            const factory = await service.createFactory({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                masterAddress: faker.finance.ethereumAddress(),
                kind: ContractType.unknown,
            });

            const result = await service.getFactory(factory.id);
            expect(result.id).toEqual(factory.id);
        });
    });

    describe('getFactories', () => {
        it('should get factory list', async () => {
            await service.createFactory({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                masterAddress: faker.finance.ethereumAddress(),
                kind: ContractType.unknown,
                chainId: 42161,
            });

            await service.createFactory({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                masterAddress: faker.finance.ethereumAddress(),
                kind: ContractType.unknown,
                chainId: 42161,
            });

            const result = await service.getFactories(42161);
            expect(result).toBeDefined();
        });
    });

    describe('getFactoryByAddress', () => {
        it('should get a factory by address', async () => {
            const address = faker.finance.ethereumAddress();
            const factory = await service.createFactory({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: address,
                masterAddress: faker.finance.ethereumAddress(),
                kind: ContractType.unknown,
                chainId: 42161,
            });

            const result = await service.getFactoryByAddress(address);
            expect(result).toBeDefined();
            expect(result.address).toEqual(address);
            expect(result.id).toEqual(factory.id);
        });
    });
});
