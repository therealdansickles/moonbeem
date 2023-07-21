import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { OrganizationService } from '../organization/organization.service';
import { User } from './user.entity';
import { UserService } from './user.service';
import { hashSync as hashPassword } from 'bcryptjs';

describe('UserService', () => {
    let service: UserService;
    let repository: Repository<User>;
    let organizationService: OrganizationService;

    beforeEach(async () => {
        service = global.userService;
        repository = global.userRepository;
        organizationService = global.organizationService;
        jest.spyOn(global.mailService, 'sendWelcomeEmail').mockImplementation(async () => {});
        jest.spyOn(global.mailService, 'sendInviteEmail').mockImplementation(async () => {});
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getUser', () => {
        it('should return user info by id', async () => {
            const user = await repository.save({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const result = await service.getUser({ id: user.id });
            expect(result.username).toEqual(user.username);
            expect(result.email).toEqual(user.email.toLowerCase());
        });

        it('should return user info by username', async () => {
            const user = await repository.save({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const result = await service.getUser({ username: user.username });
            expect(result.username).toEqual(user.username);
            expect(result.email).toEqual(user.email.toLowerCase());
        });
    });

    describe('getUserByQuery', () => {
        it('should return null if no parameter provided', async () => {
            await repository.save({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const result = await service.getUserByQuery({});
            expect(result).toBeNull();
        });

        it('should return user info by id', async () => {
            const user = await repository.save({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const result = await service.getUserByQuery({ id: user.id });
            expect(result.username).toEqual(user.username);
            expect(result.email).toEqual(user.email.toLowerCase());
        });

        it('should return user info by username', async () => {
            const user = await repository.save({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const result = await service.getUserByQuery({ username: user.username });
            expect(result.username).toEqual(user.username);
            expect(result.email).toEqual(user.email.toLowerCase());
        });
    });

    describe('createUser', () => {
        it('should create user', async () => {
            const user = await service.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            expect(user.username).toBeDefined();
            expect(user.email).toBeDefined();
            expect(user.password).toBeDefined();
        });

        it('should throw error if email has been take', async () => {
            const user = await service.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            try {
                await service.createUser({
                    username: faker.internet.userName(),
                    email: user.email,
                    password: faker.internet.password(),
                });
            } catch (error) {
                expect((error as Error).message).toBe(`This email ${user.email} is already taken.`);
            }
        });
    });

    describe('createUserWithOrganization', () => {
        it('should create user', async () => {
            const user = await service.createUserWithOrganization({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            expect(user.username).toBeDefined();
            expect(user.email).toBeDefined();
            expect(user.password).toBeDefined();

            const orgs = await organizationService.getOrganizationsByOwnerId(user.id);
            expect(orgs.length).toEqual(1);
            expect(orgs[0].owner.id).toEqual(user.id);
        });
    });

    describe('updateUser', () => {
        it('should update user info', async () => {
            const user = await repository.save({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const updatedUsername = faker.internet.userName();
            const updatedAvatarUrl = faker.internet.avatar();
            await service.updateUser(user.id, { username: updatedUsername, avatarUrl: updatedAvatarUrl });
            const updateUser = await repository.findOneBy({ id: user.id });
            expect(updateUser.username).toEqual(updatedUsername);
            expect(updateUser.avatarUrl).toEqual(updatedAvatarUrl);
        });
    });

    describe('verifyUser', () => {
        it('should verify user', async () => {
            const email = faker.internet.email();
            const password = faker.internet.password();
            await repository.insert({ email, password });

            const hashed = await hashPassword(password, 10);

            const result = await service.verifyUser(email, hashed);
            expect(result.email).toEqual(email.toLowerCase());
        });

        it('should return null on invalid credentials', async () => {
            const email = faker.internet.email();
            const password = faker.internet.password();
            await repository.insert({ email, password });

            const hashed = await hashPassword('invalid password');

            const result = await service.verifyUser(email, hashed);
            expect(result).toBeNull();
        });
    });
});
