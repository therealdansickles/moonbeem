import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { MintSaleTransaction } from './mint-sale-transaction.entity';
import { MintSaleTransactionModule } from './mint-sale-transaction.module';
import { MintSaleTransactionService } from './mint-sale-transaction.service';

describe.only('MintSaleTransactionService', () => {
    let repository: Repository<MintSaleTransaction>;
    let service: MintSaleTransactionService;

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
                MintSaleTransactionModule,
            ],
        }).compile();

        repository = module.get('sync_chain_MintSaleTransactionRepository');
        service = module.get<MintSaleTransactionService>(MintSaleTransactionService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "MintSaleTransaction" CASCADE');
    });

    describe('MintSaleTransaction', () => {
        it('should get an transaction', async () => {
            const transaction = await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getMintSaleTransaction(transaction.id);
            expect(result.id).toEqual(transaction.id);
        });
    });
});
