import { ethers } from 'ethers';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { Waitlist } from './waitlist.entity';
import { WaitlistService } from './waitlist.service';

describe('CollectionService', () => {
    let repository: Repository<Waitlist>;
    let service: WaitlistService;

    beforeAll(async () => {
        repository = global.waitlistRepository;
        service = global.waitlistService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
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

        it('should get a waitlist item by address case insensitive', async () => {
            const waitlist = await repository.save({
                email: faker.internet.email(),
                address: faker.finance.ethereumAddress(),
            });

            const result = await service.getWaitlist({ address: waitlist.address.toUpperCase() });
            expect(result.id).toBeDefined();
        });
    });

    describe('createWaitlist', () => {
        it('should create a collection', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);
            const twitter = `@${faker.person.firstName()}`;

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
            const twitter = `@${faker.person.firstName()}`;

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
            const twitter = `@${faker.person.firstName()}`;

            const waitlist = await service.createWaitlist({
                email,
                address: randomWallet.address,
                twitter,
                signature,
                message,
            });

            try {
                await service.claimWaitlist({
                    address: waitlist.address,
                    message: badMessage,
                    signature,
                });
            } catch (error) {
                expect((error as Error).message).toBe('signature verification failure');
            }
        });
    });
});
