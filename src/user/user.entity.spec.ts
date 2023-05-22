import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

import { UserModule } from './user.module';
import { User } from './user.entity';

describe('User', () => {
    let repository: Repository<User>;

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
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                UserModule,
            ],
        }).compile();

        repository = module.get('UserRepository');
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    it('should generate a hashed password', async () => {
        let user = new User();
        user.email = 'eNgIneeRinG+1@viBe.xyz';
        user.password = 'password';
        await repository.insert(user);
        user = await repository.findOneBy({ email: 'engineering+1@vibe.xyz' });
        expect(user.password).not.toEqual('password');
    });

    it('should lowercase the email', async () => {
        let user = new User();
        user.email = 'eNgIneeRinG@viBe.xyz';
        await repository.insert(user);
        user = await repository.findOneBy({ email: 'engineering@vibe.xyz' });
        expect(user.email).toEqual('engineering@vibe.xyz');
    });
});
