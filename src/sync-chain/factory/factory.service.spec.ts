import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { ContractType, Factory } from './factory.entity';
import { FactoryService } from './factory.service';
import { FactoryModule } from './factory.module';
import { MintSaleContractService } from '../mint-sale-contract/mint-sale-contract.service';
import { MintSaleContractModule } from '../mint-sale-contract/mint-sale-contract.module';

describe.only('FactoryService', () => {
    let repository: Repository<Factory>;
    let service: FactoryService;
    let saleContractService: MintSaleContractService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                FactoryModule,
                MintSaleContractModule,
            ],
        }).compile();

        repository = module.get('sync_chain_FactoryRepository');
        service = module.get<FactoryService>(FactoryService);
        saleContractService = module.get<MintSaleContractService>(MintSaleContractService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Factory" CASCADE');
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
            const factory = await service.createFactory({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                masterAddress: faker.finance.ethereumAddress(),
                kind: ContractType.unknown,
                chainId: 42161,
            });

            const factory2 = await service.createFactory({
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
            const contract = await saleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            const factory = await service.createFactory({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: contract.address,
                masterAddress: faker.finance.ethereumAddress(),
                kind: ContractType.unknown,
                chainId: 42161,
            });

            const result = await service.getFactoryByAddress(contract.address);
            expect(result).toBeDefined();
            expect(result.address).toEqual(contract.address);
            expect(result.id).toEqual(factory.id);
        });
    });
});
