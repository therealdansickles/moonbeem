import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { UserModule } from './user.module';
import { UserService } from './user.service';
import { User } from './user.entity';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationService } from '../organization/organization.service';

describe('UserService', () => {
    let service: UserService;
    let repository: Repository<User>;
    let organizationService: OrganizationService;

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
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                UserModule,
                OrganizationModule,
            ],
        }).compile();

        service = module.get<UserService>(UserService);
        repository = module.get('UserRepository');
        organizationService = module.get<OrganizationService>(OrganizationService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "User" CASCADE');
    });

    describe('getUser', () => {
        it('should return user info', async () => {
            const user = await repository.save({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const result = await service.getUser(user.id);
            expect(result.username).toEqual(user.username);
            expect(result.email).toEqual(user.email);
        });
    });

    describe('createUser', () => {
        it('should create user', async () => {
            const user = await service.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            expect(user.username).toBeDefined();
            expect(user.email).toBeDefined();
            expect(user.password).toBeDefined();
        });
    });

    describe.only('createUserWithOrganization', () => {
        it('should create user', async () => {
            const user = await service.createUserWithOrganization({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
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
                password: faker.internet.password(),
            });
            const updatedUsername = faker.internet.userName();
            const updatedAvatarUrl = faker.internet.avatar();
            await service.updateUser(user.id, { username: updatedUsername, avatarUrl: updatedAvatarUrl });
            const updateUser = await repository.findOneBy({ id: user.id });
            expect(updateUser.username).toEqual(updatedUsername);
            expect(updateUser.avatarUrl).toEqual(updatedAvatarUrl);
        });
    });
});
