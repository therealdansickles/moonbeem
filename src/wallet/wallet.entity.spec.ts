import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

import { Wallet } from './wallet.entity';
import { WalletModule } from './wallet.module';

describe('Wallet', () => {
    let repository: Repository<Wallet>;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
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
                WalletModule,
            ],
        }).compile();

        repository = module.get('WalletRepository');
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    it('should lowercase the address', async () => {
        let wallet = new Wallet();
        let address = faker.finance.ethereumAddress().toUpperCase();
        wallet.address = address;
        await repository.save(wallet);
        wallet = await repository.findOneBy({ address: address.toLowerCase() });
        expect(wallet.address).toBe(address.toLowerCase());
    });
});
