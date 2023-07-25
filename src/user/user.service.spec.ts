import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { OrganizationService } from '../organization/organization.service';
import { User } from './user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
    let service: UserService;
    let repository: Repository<User>;
    let organizationService: OrganizationService;
    let basicUser: User;

    beforeAll(async () => {
        service = global.userService;
        repository = global.userRepository;
        organizationService = global.organizationService;
        jest.spyOn(global.mailService, 'sendWelcomeEmail').mockImplementation(async () => {});
        jest.spyOn(global.mailService, 'sendInviteEmail').mockImplementation(async () => {});

        basicUser = await service.createUser({
            username: faker.internet.userName(),
            email: faker.internet.email(),
            password: 'password',
        });
    });

    afterAll(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getUserByQuery', () => {
        it('should return null if no parameter provided', async () => {
            const result = await service.getUserByQuery({});
            expect(result).toBeNull();
        });

        it('should return user info by id', async () => {
            const result = await service.getUserByQuery({ id: basicUser.id });
            expect(result.username).toEqual(basicUser.username);
            expect(result.email).toEqual(basicUser.email.toLowerCase());
        });

        it('should return user info by username', async () => {
            const result = await service.getUserByQuery({ username: basicUser.username });
            expect(result.username).toEqual(basicUser.username);
            expect(result.email).toEqual(basicUser.email.toLowerCase());
        });
    });

    describe('createUser', () => {
        it('should create user', async () => {
            expect(basicUser.username).toBeDefined();
            expect(basicUser.email).toBeDefined();
            expect(basicUser.password).toBeDefined();
        });

        it('should throw error if email has been take', async () => {
            const user = await service.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            try {
                await service.createUser({
                    username: faker.internet.userName(),
                    email: user.email,
                    password: 'password',
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
                password: 'password',
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
                password: 'password',
            });
            const updatedUsername = faker.internet.userName();
            const updatedAvatarUrl = faker.internet.avatar();
            await service.updateUser(user.id, { username: updatedUsername, avatarUrl: updatedAvatarUrl });
            const updateUser = await repository.findOneBy({ id: user.id });
            expect(updateUser.username).toEqual(updatedUsername);
            expect(updateUser.avatarUrl).toEqual(updatedAvatarUrl);
        });
    });

    describe('authenticateUser', () => {
        it('should authenticate the user', async () => {
            const result = await service.authenticateUser(basicUser.email, 'password');
            expect(result.email).toEqual(basicUser.email.toLowerCase());
        });

        it('should return null on invalid credentials', async () => {
            const result = await service.authenticateUser(basicUser.email, 'invalidpassword');
            expect(result).toBeNull();
        });
    });

    describe('verifyUser', () => {
        it('should verify the user', async () => {
            basicUser = await repository.findOneBy({ id: basicUser.id }); // reload it
            const result = await service.verifyUser(basicUser.email, basicUser.verificationToken);
            expect(result.email).toEqual(basicUser.email.toLowerCase());
            expect(result.verificationToken).toBeNull();
            expect(result.verifiedAt).toBeDefined();
        });
    });
});
