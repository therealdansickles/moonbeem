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
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationService } from '../organization/organization.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';

describe('MembershipService', () => {
    let repository: Repository<Membership>;
    let service: MembershipService;
    let membership: Membership;
    let organization: Organization;
    let organizationService: OrganizationService;
    let user: User;
    let userService: UserService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: postgresConfig.host,
                    port: postgresConfig.port,
                    username: postgresConfig.username,
                    password: postgresConfig.password,
                    database: postgresConfig.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                MembershipModule,
                OrganizationModule,
                UserModule,
            ],
        }).compile();

        repository = module.get('MembershipRepository');
        service = module.get<MembershipService>(MembershipService);
        userService = module.get<UserService>(UserService);
        organizationService = module.get<OrganizationService>(OrganizationService);

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
        });

        membership = await repository.save({
            organization: organization,
            user: user,
        });
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "User" CASCADE');
        await repository.query('TRUNCATE TABLE "Organization" CASCADE');
        await repository.query('TRUNCATE TABLE "Membership" CASCADE');
    });

    describe('getMembership', () => {
        it('should return a membership', async () => {
            const result = await service.getMembership(membership.id);
            expect(result.id).toEqual(membership.id);
        });
    });

    describe('createMembership', () => {
        it('should create a membership', async () => {
            let newUser = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            let newOrganization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
            });

            const result = await service.createMembership({
                organizationId: newOrganization.id,
                userId: newUser.id,
            });
            expect(result.id).toBeDefined();
        });

        it('should prevent duplicate memberships', async () => {
            let newUser = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            let newOrganization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
            });

            await expect(async () => {
                await service.createMembership({ organizationId: newOrganization.id, userId: newUser.id });
                await service.createMembership({ organizationId: newOrganization.id, userId: newUser.id });
                await service.createMembership({ organizationId: newOrganization.id, userId: newUser.id });
            }).rejects.toThrow();
        });
    });

    describe('updateMembership', () => {
        it('should update a membership', async () => {
            const result = await service.updateMembership(membership.id, { canEdit: true });
            expect(result.canEdit).toBeTruthy();
        });
    });

    describe('deleteMembership', () => {
        it('should delete a membership', async () => {
            const result = await service.deleteMembership(membership.id);
            expect(result).toBeTruthy();
        });
    });
});
