import { ethers } from 'ethers';

import { faker } from '@faker-js/faker';

import { UserService } from '../user/user.service';
import { SessionService } from './session.service';

describe('SessionService', () => {
    let service: SessionService;
    let userService: UserService;

    beforeAll(async () => {
        service = global.sessionService;
        userService = global.userService;
    });

    afterAll(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('createSession', () => {
        it('should return a session', async () => {
            const wallet = await ethers.Wallet.createRandom();
            const message = 'test';
            const signature = await wallet.signMessage(message);
            const result = await service.createSession(wallet.address, message, signature);

            expect(result.wallet.address).toEqual(wallet.address.toLowerCase());
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
            await userService.createUser({ email, password });
            const result = await service.createSessionFromEmail(email, password);

            expect(result.user.email).toEqual(email);
        });

        it('should return null if invalid', async () => {
            const email = 'engineering+sessionfromemail+2@vibe.xyz';
            const password = 'password';
            await userService.createUser({ email, password });
            const result = await service.createSessionFromEmail(email, 'notpassword');

            expect(result).toBeNull();
        });
    });

    describe('createSessionFromGoogle', () => {
        it('should return a session', async () => {
            const mockResponse = {
                name: faker.internet.userName(),
                gmail: faker.internet.email(),
                avatarUrl: faker.internet.avatar()
            };
            jest.spyOn(userService as any, 'authenticateFromGoogle').mockImplementation(async () => mockResponse);
            const result = await service.createSessionFromGoogle('access_token');
            expect(result.token).toBeDefined();
        });

        it('should bind to an existed user', async () => {
            const email = faker.internet.email().toLowerCase();
            const mockResponse = {
                name: faker.internet.userName(),
                gmail: email,
                avatarUrl: faker.internet.avatar()
            };
            jest.spyOn(userService as any, 'authenticateFromGoogle').mockImplementation(async () => mockResponse);
            const user = await userService.createUser({
                email,
                password: 'password'
            });
            const result = await service.createSessionFromGoogle('access_token');
            expect(result.token).toBeDefined();
            const updatedUser = await userService.getUserByQuery({ id: user.id });
            expect(updatedUser.email).toEqual(email);
            expect(updatedUser.gmail).toEqual(email);
        });

        it('should forbid after bound but no password setup', async () => {
            const email = faker.internet.email().toLowerCase();
            const mockResponse = {
                name: faker.internet.userName(),
                gmail: email,
                avatarUrl: faker.internet.avatar()
            };
            jest.spyOn(userService as any, 'authenticateFromGoogle').mockImplementation(async () => mockResponse);
            await userService.createUser({
                email,
            });
            const result = await service.createSessionFromGoogle('access_token');
            expect(result.token).toBeDefined();
            
            await expect(
                async () => await service.createSessionFromEmail(email, 'password')
            ).rejects.toThrow(`This email has been used for Google sign in. Please sign in with Google.`);
        });

        it('should work after bound and password setup', async () => {
            const email = faker.internet.email().toLowerCase();
            const mockResponse = {
                name: faker.internet.userName(),
                gmail: email,
                avatarUrl: faker.internet.avatar()
            };
            jest.spyOn(userService as any, 'authenticateFromGoogle').mockImplementation(async () => mockResponse);
            await userService.createUser({
                email,
                password: 'password'
            });
            const result = await service.createSessionFromGoogle('access_token');
            expect(result.token).toBeDefined();
            
            const authenticateByEmail = await service.createSessionFromEmail(email, 'password');
            expect(authenticateByEmail.token).toBeDefined();
            expect(authenticateByEmail.user.email).toEqual(email);
        });
    });
});
