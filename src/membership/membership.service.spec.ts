import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { Membership } from './membership.entity';
import { MembershipService } from './membership.service';

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
        jest.spyOn(global.mailService, 'sendInviteEmail').mockImplementation(() => {});
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
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
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
                password: 'password',
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

    describe('checkMembershipByOrganizationIdAndUserId', () => {
        it('should return true if a record exist', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            const rs = await service.checkMembershipByOrganizationIdAndUserId(organization.id, user.id);
            expect(rs).toEqual(true);
        });

        it('should return false if no record exist', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            const rs = await service.checkMembershipByOrganizationIdAndUserId(organization.id, faker.datatype.uuid());
            expect(rs).toEqual(false);
        });
    });

    describe('createMembership', () => {
        it('should create a membership', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const result = await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
                canDeploy: true,
            });

            expect(result).toBeDefined();
            expect(result.length).toBe(1);
            expect(result[0].id).toBeDefined();
            expect(result[0].canDeploy).toBeTruthy();
            expect(result[0].organization.id).toEqual(organization.id);
            expect(result[0].organization.owner.id).not.toBeNull();
            expect(result[0].user.id).toEqual(user.id);
        });

        it('should go through if membership exist', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const result = await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
                canDeploy: true,
            });

            const resultAgain = await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
                canDeploy: true,
            });

            expect(result).toBeDefined();
            expect(result.length).toBe(1);
            expect(result[0].id).toEqual(resultAgain[0].id);
        });

        it("should work if user does't exist", async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const emailForNewUser = faker.internet.email();
            const result = await service.createMembership(emailForNewUser, {
                organization: organization,
                canDeploy: true,
            });

            expect(result.user).toBeFalsy();
            expect(result.email).toEqual(emailForNewUser.toLowerCase());
        });

        it('should only create one record for invitation flow', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const emailForNewUser = faker.internet.email();
            const result = await service.createMembership(emailForNewUser, {
                organization: organization,
                canDeploy: true,
            });

            const resultAgain = await service.createMembership(emailForNewUser, {
                organization: organization,
                canDeploy: true,
            });

            expect(result.id).toEqual(resultAgain.id);
        });
    });

    describe('updateMembership', () => {
        it('should update a membership', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const membership = await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            const result = await service.updateMembership(membership[0].id, { canEdit: true });
            expect(result.canEdit).toBeTruthy();
        });
    });

    describe('acceptMembership', () => {
        it('should accept a membership request', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const membership = await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            const result = await service.acceptMembership({
                email: user.email,
                organizationId: organization.id,
                inviteCode: membership[0].inviteCode,
            });

            expect(result).toBeTruthy;
        });

        it('should fail and reject request without invite code', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            try {
                await service.acceptMembership({ email: user.email, organizationId: organization.id, inviteCode: '' });
            } catch (error) {
                expect((error as Error).message).toBe(
                    `We couldn't find a membership request for ${user.email} to organization ${organization.id}.`
                );
            }
        });
    });

    describe('declineMembership', () => {
        it('should decline a membership request', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const membership = await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            const result = await service.declineMembership({
                email: user.email,
                organizationId: organization.id,
                inviteCode: membership[0].inviteCode,
            });

            expect(result).toBeTruthy;
        });

        it('should fail and reject request without invite code', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            try {
                await service.declineMembership({ email: user.email, organizationId: organization.id, inviteCode: '' });
            } catch (error) {
                expect((error as Error).message).toBe(
                    `We couldn't find a membership request for ${user.email} to organization ${organization.id}.`
                );
            }
        });
    });

    describe('deleteMembership', () => {
        it('should delete a membership', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const membership = await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            const result = await service.deleteMembership(membership[0].id);
            expect(result).toBeTruthy();
        });
    });

    describe('createMemberships', () => {
        it('should be create memberships via multiple emails', async () => {
            const user1 = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });
            const user2 = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const memberships = await service.createMemberships({
                organizationId: organization.id,
                emails: [user1.email, user2.email],
            });

            expect(memberships.length).toBe(2);
            expect(memberships[0].email).toBe(user1.email);
            expect(memberships[0].inviteCode).toBeDefined();

            expect(memberships[1].email).toBe(user2.email);
            expect(memberships[1].inviteCode).toBeDefined();

            expect(memberships[0].organization.id).toBe(memberships[1].organization.id);
        });
    });
});
