import { Test, TestingModule } from '@nestjs/testing';

import { Asset721Module } from './asset721.module';
import { Asset721Service } from './asset721.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';

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

    describe('getAsset721ByQuery', () => {
        it('should get nothing', async () => {
            const asset = await service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(5),
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getAsset721ByQuery({});
            expect(result).toBeNull()
        });

        it('should get an asset', async () => {
            const address = faker.finance.ethereumAddress();

            const asset1 = await service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address,
                tokenId: faker.random.numeric(5),
                owner: faker.finance.ethereumAddress(),
            });

            const asset2 = await service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address,
                tokenId: faker.random.numeric(5),
                owner: faker.finance.ethereumAddress(),
            });


            const result = await service.getAsset721ByQuery({ tokenId: asset1.tokenId, address });
            expect(result.id).toEqual(asset1.id);
        });
    });
});
