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
                avatarUrl: faker.image.url(),
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
                avatarUrl: faker.image.url(),
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
                avatarUrl: faker.image.url(),
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
                avatarUrl: faker.image.url(),
                owner: owner,
            });

            await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            const rs = await service.checkMembershipByOrganizationIdAndUserId(organization.id, faker.string.uuid());
            expect(rs).toEqual(false);
        });
    });

    describe('createMembership', () => {
        let user;
        let owner;
        let organization;
        beforeEach(async () => {
            user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                owner: owner,
            });
        });
        it('should create a membership', async () => {
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

        it('should skip if the email is empty', async () => {
            const result = await service.createMemberships({
                organizationId: organization.id,
                emails: ['', null, undefined],
                canDeploy: true,
            });
            expect(result).toBeDefined();
            expect(result.length).toBe(0);
        });

        it('should go through if membership exist', async () => {
            const result = await service.createMembership(user.email, {
                organization,
                canDeploy: true,
            });

            const resultAgain = await service.createMembership(user.email, {
                organization,
                canDeploy: true
            });

            expect(result).toBeDefined();
            expect(result.id).toEqual(resultAgain.id);
        });

        it('should go through if memberships exist', async () => {
            const user1 = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const owner1 = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization1 = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                owner: owner1,
            });
            // TODO: The test will fail if we reuse the user/owner/organization.
            //   Not sure why the organization can be found in the second call.
            //   And I think we can remove this test as I created another one to test this case
            //      using createMembership() instead of createMemberships()
            const result = await service.createMemberships({
                organizationId: organization1.id,
                emails: [user1.email],
                canDeploy: true,
            });

            const resultAgain = await service.createMemberships({
                organizationId: organization1.id,
                emails: [user1.email],
                canDeploy: true,
            });

            expect(result).toBeDefined();
            expect(result.length).toBe(1);
            expect(result[0].id).toEqual(resultAgain[0].id);
        });

        it("should work if user doesn't exist", async () => {
            const emailForNewUser = faker.internet.email();
            const result = await service.createMembership(emailForNewUser, {
                organization: organization,
                canDeploy: true,
            });

            expect(result.user).toBeFalsy();
            expect(result.email).toEqual(emailForNewUser.toLowerCase());
        });

        it('should only create one record for invitation flow', async () => {
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

        it('should refill invited code if create membership again', async () => {
            const emailForNewUser = faker.internet.email();
            const existedMembership = await service.createMembership(emailForNewUser, {
                organization: organization,
                canDeploy: true,
            });
            existedMembership.inviteCode = null;
            await existedMembership.save();

            const updatedMembership = await service.createMembership(emailForNewUser, {
                organization: organization,
                canDeploy: true,
            });

            expect(updatedMembership.inviteCode).toBeDefined();
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
                avatarUrl: faker.image.url(),
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
                avatarUrl: faker.image.url(),
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
                avatarUrl: faker.image.url(),
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

        it('should re attach the user if there is a membership already', async () => {
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
                avatarUrl: faker.image.url(),
                owner: owner,
            });

            const membership = repository.create({
                email: user.email,
                canDeploy: true,
            });
            membership.organization = organization;
            const updatedMembership = await repository.save(membership);

            const existBeforeCreation = await service.checkMembershipByOrganizationIdAndUserId(
                organization.id,
                user.id
            );
            expect(existBeforeCreation).toBeFalsy();
            await service.acceptMembership({
                organizationId: organization.id,
                email: user.email,
                inviteCode: updatedMembership.inviteCode,
            });
            const existAfterCreation = await service.checkMembershipByOrganizationIdAndUserId(organization.id, user.id);
            expect(existAfterCreation).toBeTruthy();
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
                avatarUrl: faker.image.url(),
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
                avatarUrl: faker.image.url(),
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
                avatarUrl: faker.image.url(),
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
                avatarUrl: faker.image.url(),
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
