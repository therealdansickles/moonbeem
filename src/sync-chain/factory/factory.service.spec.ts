import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { ContractType } from './factory.entity';
import { FactoryService } from './factory.service';
import { FactoryModule } from './factory.module';

describe('FactoryService', () => {
    let service: FactoryService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                FactoryModule,
            ],
        }).compile();

        service = module.get<FactoryService>(FactoryService);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('getFactory', () => {
        it('should get an factory', async () => {
            const factory = await service.createFactory({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
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
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                masterAddress: faker.finance.ethereumAddress(),
                kind: ContractType.unknown,
                chainId: 42161,
            });

            await service.createFactory({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
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
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
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
