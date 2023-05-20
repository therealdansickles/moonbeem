import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

import { Membership } from './membership.entity';
import { MembershipModule } from './membership.module';
import { MembershipService } from './membership.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';

describe('MembershipService', () => {
    let repository: Repository<Membership>;
    let service: MembershipService;
    let organization: Organization;
    let organizationService: OrganizationService;
    let organizationRepository: Repository<Organization>;
    let user: User;
    let userService: UserService;
    let userRepository: Repository<User>;

    beforeEach(async () => {
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
                MembershipModule,
            ],
        }).compile();

        repository = module.get('MembershipRepository');
        service = module.get<MembershipService>(MembershipService);
        userService = module.get<UserService>(UserService);
        userRepository = module.get('UserRepository');
        organizationService = module.get<OrganizationService>(OrganizationService);
        organizationRepository = module.get('OrganizationRepository');

        user = await userService.createUser({
            email: faker.internet.email(),
            username: faker.internet.userName(),
            password: faker.internet.password(),
        });

        organization = await organizationService.createOrganization({
            name: faker.company.name(),
            displayName: faker.company.name(),
            about: faker.company.catchPhrase(),
            avatarUrl: faker.image.imageUrl(),
            owner: user,
        });
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('getMembership', () => {
        it('should return a membership', async () => {
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
            const result = await service.getMembershipsByOrganizationId(organization.id);
            expect(result.length).toEqual(1);
            expect(result[0].user.id).toEqual(user.id);
            expect(result[0].organization.id).toEqual(organization.id);
        });
    });

    describe('createMembership', () => {
        it('should create a membership', async () => {
            const newUser = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const newOrganization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const result = await service.createMembership({
                organizationId: newOrganization.id,
                userId: newUser.id,
                canDeploy: true,
            });
            expect(result.id).toBeDefined();
            expect(result.canDeploy).toBeTruthy();
            expect(result.organization.id).toEqual(newOrganization.id);
            expect(result.organization.owner.id).not.toBeNull();
            expect(result.user.id).toEqual(newUser.id);
        });

        it('should prevent duplicate memberships', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
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

            await expect(async () => {
                await service.acceptMembership({ userId: user.id, organizationId: organization.id, inviteCode: '' });
            }).rejects.toThrow();
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

            await expect(async () => {
                await service.declineMembership({ userId: user.id, organizationId: organization.id, inviteCode: '' });
            }).rejects.toThrow();
        });
    });

    describe('deleteMembership', () => {
        it('should delete a membership', async () => {
            const membership = await repository.findOneBy({
                organization: { id: organization.id },
                user: { id: user.id },
            });
            const result = await service.deleteMembership(membership.id);
            expect(result).toBeTruthy();
        });
    });
});
