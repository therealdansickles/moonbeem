import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { UserModule } from '../user/user.module';
import { User } from '../user/user.entity';
import { AuthService } from './auth.service';
import { AuthModule } from './auth.module';
import { OrganizationService } from '../organization/organization.service';
import { OrganizationModule } from '../organization/organization.module';
import { UserService } from '../user/user.service';
import { MembershipService } from '../membership/membership.service';
import { MembershipModule } from '../membership/membership.module';
import { Membership } from '../membership/membership.entity';
import { GraphQLError } from 'graphql';

describe('AuthService', () => {
    let service: AuthService;
    let organizationService: OrganizationService;
    let userService: UserService;
    let membershipService: MembershipService;

    let repository: Repository<Membership>;

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
                AuthModule,
                OrganizationModule,
                MembershipModule,
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        membershipService = module.get<MembershipService>(MembershipService);

        repository = module.get('MembershipRepository');
    });

    afterAll(async () => {
        //await repository.query('TRUNCATE TABLE "User" CASCADE');
    });

    describe('createUserWithEmail', () => {
        it('should create a user with email and password', async () => {
            const email = faker.internet.email();

            const user = await service.createUserWithEmail({
                username: faker.internet.userName(),
                email,
                password: faker.internet.password(),
            });

            expect(user.sessionToken).toBeDefined();
            expect(user.user.email).toEqual(email.toLowerCase());
        });

        it('should not create a user with an email that already exists', async () => {
            const email = faker.internet.email();

            const user = await service.createUserWithEmail({
                username: faker.internet.userName(),
                email,
                password: faker.internet.password(),
            });

            expect(user.sessionToken).toBeDefined();
            expect(user.user.email).toEqual(email.toLowerCase());

            expect(async () => {
                await service.createUserWithEmail({
                    username: faker.internet.userName(),
                    email,
                    password: faker.internet.password(),
                });
            }).rejects.toThrow('A user with this email already exists.');
        });

        it('should not create a user with a username that already exists', async () => {
            const username = faker.internet.userName();

            await service.createUserWithEmail({
                username,
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            expect(async () => {
                await service.createUserWithEmail({
                    username,
                    email: faker.internet.email(),
                    password: faker.internet.password(),
                });
            }).rejects.toThrow('A user with this username already exists.');
        });

        it('should create a user that was invited to an org and accept its membership', async () => {
            const inviteeEmail = faker.internet.email();

            const owner = await service.createUserWithEmail({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner.user,
                invites: [{ email: inviteeEmail }],
            });

            const pendingMembership = await repository.findOne({ where: { email: inviteeEmail.toLowerCase() } });

            const invitedUser = await service.createUserWithEmail({
                username: faker.internet.userName(),
                email: inviteeEmail,
                password: faker.internet.password(),
                inviteCode: pendingMembership.inviteCode,
            });

            expect(invitedUser.user).toBeDefined();

            const memberships = await membershipService.getMembershipsByUserId(invitedUser.user.id);

            // we had 2 memberships now
            // the first one is the invited one to be join
            // the second one is his/her "private organization"
            expect(memberships.length).toBe(2);
            expect(memberships[0].acceptedAt).toBeDefined();
            // only one have inviteCode
            expect(memberships.map((m) => m.inviteCode).filter((m) => !!m).length).toEqual(1);
        });
    });
});
