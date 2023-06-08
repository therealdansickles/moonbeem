import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { Asset721Module } from './asset721.module';
import { Asset721Service } from './asset721.service';

describe('Asset721Service', () => {
    let service: Asset721Service;

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
                    dropSchema: true,
                }),
                Asset721Module,
            ],
        }).compile();

        service = module.get<Asset721Service>(Asset721Service);
    });

    afterAll(async () => {
        global.gc && global.gc();
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
