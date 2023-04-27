import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { Asset721Module } from './asset721.module';
import { Asset721Service } from './asset721.service';
import { Asset721 } from './asset721.entity';

describe.only('Asset721Service', () => {
    let repository: Repository<Asset721>;
    let service: Asset721Service;

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
                Asset721Module,
            ],
        }).compile();

        repository = module.get('sync_chain_Asset721Repository');
        service = module.get<Asset721Service>(Asset721Service);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Asset721" CASCADE');
    });

    describe('asset721', () => {
        it('should get an asset', async () => {
            const asset = await service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(5),
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getAsset721(asset.id);
            expect(result.id).toEqual(asset.id);
        });
    });
});
