import { Test, TestingModule } from '@nestjs/testing';
import { RoyaltyService } from './royalty.service';
import { Repository } from 'typeorm';
import { Royalty } from './royalty.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from '../../lib/configs/db.config';
import { RoyaltyModule } from './royalty.module';
import { faker } from '@faker-js/faker';

describe('RoyaltyService', () => {
    let repository: Repository<Royalty>;
    let service: RoyaltyService;

    beforeEach(async () => {
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
                    dropSchema: true,
                }),
                RoyaltyModule,
            ],
        }).compile();

        repository = module.get('sync_chain_RoyaltyRepository');
        service = module.get<RoyaltyService>(RoyaltyService);
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
