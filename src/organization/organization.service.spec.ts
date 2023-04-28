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

describe.only('OrganizationService', () => {
    let repository: Repository<Organization>;
    let service: OrganizationService;
    let userService: UserService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                OrganizationModule,
                UserModule,
            ],
        }).compile();

        repository = module.get('OrganizationRepository');
        service = module.get<OrganizationService>(OrganizationService);
        userService = module.get<UserService>(UserService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "User" CASCADE');
        await repository.query('TRUNCATE TABLE "Organization" CASCADE');
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
        });

        it('should throw an error when create a organization with an existed name', async () => {
            await expect(() =>
                service.createOrganization({
                    name: organization.name,
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
});
