import { Repository } from 'typeorm';
import { Waitlist } from './waitlist.entity';
import { WaitlistService } from './waitlist.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from '../lib/configs/db.config';
import { WaitlistModule } from './waitlist.module';
import { faker } from '@faker-js/faker';
import { ethers } from 'ethers';

describe('CollectionService', () => {
    let repository: Repository<Waitlist>;
    let service: WaitlistService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                WaitlistModule,
            ],
        }).compile();

        repository = module.get('WaitlistRepository');
        service = module.get<WaitlistService>(WaitlistService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Waitlist" CASCADE');
    });

    describe('getWaitlist', () => {
        it('should get a waitlist item by email', async () => {
            const waitlist = await repository.save({
                email: faker.internet.email(),
                address: faker.finance.ethereumAddress(),
            });

            const result = await service.getWaitlist({ email: waitlist.email });
            expect(result.id).toBeDefined();
        });

        it('should get a waitlist item by address', async () => {
            const waitlist = await repository.save({
                email: faker.internet.email(),
                address: faker.finance.ethereumAddress(),
            });

            const result = await service.getWaitlist({ address: waitlist.address });
            expect(result.id).toBeDefined();
        });
    });

    describe('createWaitlist', () => {
        it('should create a collection', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);
            const twitter = `@${faker.name.firstName()}`;

            const waitlist = await service.createWaitlist({
                email,
                address: randomWallet.address,
                twitter,
                signature,
                message,
            });

            expect(waitlist).toBeDefined();
            expect(waitlist.email).toEqual(email);
            expect(waitlist.address).toEqual(randomWallet.address);
            expect(waitlist.twitter).toEqual(twitter);
        });
    });

    describe('claimWaitlist', () => {
        it('should update a waitlist item', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);
            const twitter = `@${faker.name.firstName()}`;

            const waitlist = await service.createWaitlist({
                email,
                address: randomWallet.address,
                twitter,
                signature,
                message,
            });

            const result = await service.claimWaitlist({
                address: waitlist.address,
                signature,
                message,
            });

            expect(result).toBeTruthy();
        });

        it('should throw an error if the signature is invalid', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'YOOOO from tests!';
            const badMessage = 'im the wrong message to sign';
            const signature = await randomWallet.signMessage(message);
            const twitter = `@${faker.name.firstName()}`;

            const waitlist = await service.createWaitlist({
                email,
                address: randomWallet.address,
                twitter,
                signature,
                message,
            });

            await expect(async () => {
                await service.claimWaitlist({
                    address: waitlist.address,
                    message: badMessage,
                    signature,
                });
            }).rejects.toThrow('verification failure');
        });
    });
});
