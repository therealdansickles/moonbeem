import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { Record721Module } from './record721.module';
import { Record721Service } from './record721.service';

describe('Record721Service', () => {
    let service: Record721Service;

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
                Record721Module,
            ],
        }).compile();

        service = module.get<Record721Service>(Record721Service);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('erc721 record', () => {
        it('should get an contract', async () => {
            const record = await service.createRecord721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                name: 'USC Coin',
                symbol: 'USDC',
                baseUri: 'https://',
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getRecord721(record.id);
            expect(result.id).toEqual(record.id);
        });
    });
});
