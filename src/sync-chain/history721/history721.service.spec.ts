import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { History721, History721Type } from './history721.entity';
import { History721Module } from './history721.module';
import { History721Service } from './history721.service';

describe.only('History721Service', () => {
    let repository: Repository<History721>;
    let service: History721Service;

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
                History721Module,
            ],
        }).compile();

        repository = module.get('sync_chain_History721Repository');
        service = module.get<History721Service>(History721Service);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('history721', () => {
        it('should get an nft history', async () => {
            const history = await service.createHistory721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(5),
                sender: faker.finance.ethereumAddress(),
                receiver: faker.finance.ethereumAddress(),
                kind: History721Type.unknown,
            });

            const result = await service.getHistory721(history.id);
            expect(result.id).toEqual(history.id);
        });
    });
});
