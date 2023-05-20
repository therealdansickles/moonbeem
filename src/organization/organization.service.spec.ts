import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { Organization } from './organization.entity';
import { OrganizationModule } from './organization.module';
import { OrganizationService } from './organization.service';
import { CreateOrganizationInput } from './organization.dto';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { MembershipService } from '../membership/membership.service';
import { MembershipModule } from '../membership/membership.module';
import { Membership } from '../membership/membership.entity';

describe.only('OrganizationService', () => {
    let repository: Repository<Organization>;
    let service: OrganizationService;
    let userService: UserService;
    let membershipService: MembershipService;
    let membershipRepository: Repository<Membership>;

    beforeAll(async () => {
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
                OrganizationModule,
            ],
        }).compile();

        repository = module.get('OrganizationRepository');
        service = module.get<OrganizationService>(OrganizationService);
        userService = module.get<UserService>(UserService);
        membershipService = module.get<MembershipService>(MembershipService);
        membershipRepository = module.get('MembershipRepository');
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('getOrganization', () => {
        it('should get an organization', async () => {
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

            const result = await service.getOrganization(organization.id);
            expect(result.id).toEqual(organization.id);
        });
    });

    describe('createOrganization', () => {
        let organization: Organization;
        let owner: User;

        beforeEach(async () => {
            await repository.delete({});
            await membershipRepository.delete({});
        });

        it('should create an organization', async () => {
            owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            organization = await service.createOrganization({
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
            owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const invitee = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            organization = await service.createOrganization({
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
            const name = faker.company.name();
            service.createOrganization({
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
            await expect(() =>
                service.createOrganization({
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
                })
            ).rejects.toThrow();
        });
    });

    describe('createPersonalOrganization', () => {
        it('should create a personal organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
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
        let organization: Organization;
        let owner: User;

        it('should update an organization', async () => {
            owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            organization = await service.createOrganization({
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

            await expect(() =>
                service.updateOrganization(anotherOrganization.id, {
                    name: organization.name,
                })
            ).rejects.toThrow();
        });
    });

    describe('deleteOrganization', () => {
        it('should delete an organization', async () => {
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
        });
    });

    describe('transferOrganization', () => {
        it('should transfer an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const user = await userService.createUser({
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

            const result = await service.transferOrganization(organization.id, user.id);
            expect(result.owner.id).toEqual(user.id);
        });

        it('should throw an error if the user does not exist', async () => {
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

            expect(() => service.transferOrganization(organization.id, faker.datatype.uuid())).rejects.toThrow(
                "doesn't exist"
            );
        });
    });

    describe('getOrganizationsByOwnerId', () => {
        it('should return all the organizations a user is owner on', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const differentOwner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
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
