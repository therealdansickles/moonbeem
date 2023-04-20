import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { Organization } from './organization.entity';
import { OrganizationModule } from './organization.module';
import { OrganizationService } from './organization.service';
import { CreateOrganizationInput } from './organization.dto';

describe.only('OrganizationService', () => {
    let repository: Repository<Organization>;
    let service: OrganizationService;

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
                OrganizationModule,
            ],
        }).compile();

        repository = module.get('OrganizationRepository');
        service = module.get<OrganizationService>(OrganizationService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Organization" CASCADE');
    });

    describe('getOrganization', () => {
        it('should get an organization', async () => {
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
            });

            const result = await service.getOrganization(organization.id);
            expect(result.id).toEqual(organization.id);
        });
    });

    describe('createOrganization', () => {
        it('should create an organization', async () => {
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
            });

            expect(organization.id).toBeDefined();
        });
    });

    describe('updateOrganization', () => {
        it('should update an organization', async () => {
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
            });

            const result = await service.updateOrganization(organization.id, {
                displayName: 'The best organization',
            });

            expect(result.displayName).toEqual('The best organization');
        });
    });

    describe('deleteOrganization', () => {
        it('should delete an organization', async () => {
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
            });

            const result = await service.deleteOrganization(organization.id);
            expect(result).toBeTruthy();
        });
    });
});
