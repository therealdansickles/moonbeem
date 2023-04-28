import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { MintSaleContract } from './mint-sale-contract.entity';
import { MintSaleContractModule } from './mint-sale-contract.module';
import { MintSaleContractService } from './mint-sale-contract.service';

describe.only('MintSaleContractService', () => {
    let repository: Repository<MintSaleContract>;
    let service: MintSaleContractService;

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
                MintSaleContractModule,
            ],
        }).compile();

        repository = module.get('sync_chain_MintSaleContractRepository');
        service = module.get<MintSaleContractService>(MintSaleContractService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "MintSaleContract" CASCADE');
    });

    describe('MintSaleContract', () => {
        it('should get an contract', async () => {
            const contract = await service.createMintSaleContract({
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

            const result = await service.getMintSaleContract(contract.id);
            expect(result.id).toEqual(contract.id);
        });
    });
    describe('MerkleTree', () => {
        const amount = faker.random.numeric(3);
        const address = faker.finance.ethereumAddress();
        let merkleRoot = '';
        it('should create merkle tree', async () => {
            const result = await service.createMerkleRoot({
                data: [{ address: address, amount: amount }],
            });
            merkleRoot = result.merkleRoot;
            expect(result.merkleRoot).toBeDefined();
        });
        it('should get merkle proof', async () => {
            const result = await service.getMerkleProof(address, merkleRoot);

            expect(result).toBeDefined();
            expect(result.address.toLowerCase()).toBe(address.toLowerCase());
            expect(result.amount).toBe(amount);
            expect(result.proof).toBeDefined();
        });
    });
});
