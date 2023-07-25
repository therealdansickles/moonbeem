import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { OrganizationService } from './organization.service';
import { UserService } from '../user/user.service';
import { Membership } from '../membership/membership.entity';

describe('OrganizationService', () => {
    let service: OrganizationService;
    let userService: UserService;
    let membershipRepository: Repository<Membership>;

    beforeAll(async () => {
        service = global.organizationService;
        userService = global.userService;
        membershipRepository = global.membershipRepository;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getOrganization', () => {
        it('should get an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const result = await service.getOrganization(organization.id);
            expect(result.id).toEqual(organization.id);
        });
    });

    describe('createOrganization', () => {
        it('should create an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const organization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            expect(organization.id).toBeDefined();
            expect(organization.owner.id).toEqual(owner.id);
            expect(organization.owner.email).toEqual(owner.email);

            const memberships = await membershipRepository.findBy({
                organization: { id: organization.id },
                user: { id: owner.id },
            });

            expect(memberships.length).toEqual(1);
            expect(memberships[0].canDeploy).toEqual(true);
            expect(memberships[0].canEdit).toEqual(true);
            expect(memberships[0].canManage).toEqual(true);
        });

        it.skip('should create an organization and invite users', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            expect(organization.id).toBeDefined();
            expect(organization.owner.id).toEqual(owner.id);
            expect(organization.owner.email).toEqual(owner.email);
        });

        it('should throw an error when create a organization with an existed name', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const name = faker.company.name();
            await service.createOrganization({
                name,
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            try {
                await service.createOrganization({
                    name,
                    displayName: faker.company.name(),
                    about: faker.company.catchPhrase(),
                    avatarUrl: faker.image.imageUrl(),
                    backgroundUrl: faker.image.imageUrl(),
                    websiteUrl: faker.internet.url(),
                    twitter: faker.internet.userName(),
                    instagram: faker.internet.userName(),
                    discord: faker.internet.userName(),
                    owner: owner,
                });
            } catch (error) {
                expect((error as Error).message).toBe(`Organization with name ${name} already existed.`);
            }
        });
    });

    describe('createPersonalOrganization', () => {
        it('should create a personal organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await service.createPersonalOrganization(owner);

            expect(organization.id).toBeDefined();
            expect(organization.name).toBeDefined();
            expect(organization.owner.id).toEqual(owner.id);
            expect(organization.kind).toEqual('personal');
            expect(organization.owner.email).toEqual(owner.email);
        });
    });

    describe('updateOrganization', () => {
        it('should update an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const result = await service.updateOrganization(organization.id, {
                displayName: 'The best organization',
            });

            expect(result.displayName).toEqual('The best organization');
            expect(result.owner.id).toEqual(owner.id);
            expect(result.owner.email).toEqual(owner.email);
        });

        it('should throw an error when update an organization with an existed name', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const anotherOrganization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            try {
                await service.updateOrganization(anotherOrganization.id, {
                    name: organization.name,
                });
            } catch (error) {
                expect((error as Error).message).toBe(`Organization with name ${organization.name} already existed.`);
            }
        });
    });

    describe('deleteOrganization', () => {
        it('should delete an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const result = await service.deleteOrganization(organization.id);
            expect(result).toBeTruthy();
        });
        it('shoule delete organization and membership, if only one member', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const result = await service.deleteOrganization(organization.id);
            expect(result).toBeTruthy();

            const memberships = await membershipRepository.findBy({
                organization: { id: organization.id },
                user: { id: owner.id },
            });

            expect(memberships.length).toEqual(0);
        });

        it('should throw an error, if org contains more than two memberships', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const owner2 = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });
            await membershipRepository.create({
                canEdit: true,
                canDeploy: true,
                canManage: true,
                user: { id: owner2.id },
                organization: { id: organization.id },
            });
            try {
                await service.deleteOrganization(organization.id);
            } catch (error) {
                expect((error as Error).message).toBe(/Organization contains more than two memberships./);
            }
        });
    });

    describe('transferOrganization', () => {
        it('should transfer an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const result = await service.transferOrganization(organization.id, user.id);
            expect(result.owner.id).toEqual(user.id);
        });

        it('should throw an error if the user does not exist', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            const randomUUID = faker.datatype.uuid();

            try {
                await service.transferOrganization(organization.id, randomUUID);
            } catch (error) {
                expect((error as Error).message).toBe(`User with id ${randomUUID} doesn't exist.`);
            }
        });
    });

    describe('getOrganizationsByOwnerId', () => {
        it('should return all the organizations a user is owner on', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const differentOwner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: differentOwner,
            });

            const result = await service.getOrganizationsByOwnerId(owner.id);
            expect(result.length).toEqual(2);
        });
    });
});
