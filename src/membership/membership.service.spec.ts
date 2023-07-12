import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Membership } from './membership.entity';
import { MembershipService } from './membership.service';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';

describe('MembershipService', () => {
    let repository: Repository<Membership>;
    let service: MembershipService;
    let organizationService: OrganizationService;
    let userService: UserService;

    beforeAll(async () => {
        service = global.membershipService;
        userService = global.userService;
        organizationService = global.organizationService;
        repository = global.membershipRepository;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getMembership', () => {
        it('should return a membership', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
            });

            const membership = await repository.findOneBy({
                organization: { id: organization.id },
                user: { id: user.id },
            });
            const result = await service.getMembership(membership.id);
            expect(result.id).toEqual(membership.id);
            expect(result.user.id).toEqual(user.id);
            expect(result.organization.id).toEqual(organization.id);
        });
    });

    describe('getMembershipsByOrganizationId', () => {
        it('should return memberships', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const result = await service.getMembershipsByOrganizationId(organization.id);
            expect(result.length).toEqual(1);
            expect(result[0].user.id).toEqual(owner.id);
            expect(result[0].organization.id).toEqual(organization.id);
        });
    });

    describe('createMembership', () => {
        it('should create a membership', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const result = await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
                canDeploy: true,
            });
            expect(result.id).toBeDefined();
            expect(result.canDeploy).toBeTruthy();
            expect(result.organization.id).toEqual(organization.id);
            expect(result.organization.owner.id).not.toBeNull();
            expect(result.user.id).toEqual(user.id);
        });

        it('should prevent duplicate memberships', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
            });

            const newOrganization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            await expect(async () => {
                await service.createMembership({ organizationId: newOrganization.id, userId: owner.id });
            }).rejects.toThrow();
        });
    });

    describe('updateMembership', () => {
        it('should update a membership', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const membership = await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
            });

            const result = await service.updateMembership(membership.id, { canEdit: true });
            expect(result.canEdit).toBeTruthy();
        });
    });

    describe('acceptMembership', () => {
        it('should accept a membership request', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const membership = await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
            });

            const result = await service.acceptMembership({
                userId: user.id,
                organizationId: organization.id,
                inviteCode: membership.inviteCode,
            });

            expect(result).toBeTruthy;
        });

        it('should fail and reject request without invite code', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
            });

            try {
                await service.acceptMembership({ userId: user.id, organizationId: organization.id, inviteCode: '' });
            } catch (error) {
                expect((error as Error).message).toBe(
                    `Accept membership request for user ${user.id} to organization ${organization.id} doesn't exist.`
                );
            }
        });
    });

    describe('declineMembership', () => {
        it('should decline a membership request', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const membership = await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
            });

            const result = await service.declineMembership({
                userId: user.id,
                organizationId: organization.id,
                inviteCode: membership.inviteCode,
            });

            expect(result).toBeTruthy;
        });

        it('should fail and reject request without invite code', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            try {
                await service.declineMembership({ userId: user.id, organizationId: organization.id, inviteCode: '' });
            } catch (error) {
                expect((error as Error).message).toBe(
                    `Decline membership request for user ${user.id} to organization ${organization.id} doesn't exist.`
                );
            }
        });
    });

    describe('deleteMembership', () => {
        it('should delete a membership', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const membership = await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
            });

            const result = await service.deleteMembership(membership.id);
            expect(result).toBeTruthy();
        });
    });
});
