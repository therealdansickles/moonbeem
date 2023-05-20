import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { postgresConfig } from '../lib/configs/db.config';
import { hashSync as hashPassword } from 'bcryptjs';

import { SessionService } from './session.service';
import { SessionModule } from './session.module';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';

describe('SessionService', () => {
    let service: SessionService;
    let userService: UserService;

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
                SessionModule,
                UserModule,
                WalletModule,
            ],
        }).compile();

        service = module.get<SessionService>(SessionService);
        userService = module.get<UserService>(UserService);
    });

    describe('createSession', () => {
        it('should return a session', async () => {
            const wallet = await ethers.Wallet.createRandom();
            const message = 'test';
            const signature = await wallet.signMessage(message);
            const result = await service.createSession(wallet.address, message, signature);

            expect(result.wallet.address).toEqual(wallet.address);
        });

        it('should return null if invalid wallet verification', async () => {
            const wallet = await ethers.Wallet.createRandom();
            const message = 'test';
            const signature = await wallet.signMessage(message);
            const result = await service.createSession(wallet.address, 'bobby', signature);

            expect(result).toBeNull();
        });
    });

    describe('createSessionFromEmail', () => {
        it('should return a session', async () => {
            const email = 'engineering+sessionfromemail@vibe.xyz';
            const password = 'password';
            const user = await userService.createUser({ email, password });
            const hashed = await hashPassword(password, 10);
            const result = await service.createSessionFromEmail(email, hashed);

            expect(result.user.email).toEqual(email);
        });

        it('should return null if invalid', async () => {
            const email = 'engineering+sessionfromemail+2@vibe.xyz';
            const password = 'password';
            const user = await userService.createUser({ email, password });
            const hashed = await hashPassword('wrong password');
            const result = await service.createSessionFromEmail(email, hashed);

            expect(result).toBeNull();
        });
    });
});
