import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
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

export const gql = String.raw;

describe('MembershipResolver', () => {
    let app: INestApplication;
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
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [MembershipModule, OrganizationModule, UserModule],
                }),
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

        const owner = await userService.createUser({
            email: faker.internet.email(),
            username: faker.internet.userName(),
            password: faker.internet.password(),
        });

        organization = await organizationService.createOrganization({
            name: faker.company.name(),
            displayName: faker.company.name(),
            about: faker.company.catchPhrase(),
            avatarUrl: faker.image.imageUrl(),
            owner: owner,
        });

        membership = await service.createMembership({
            organizationId: organization.id,
            userId: user.id,
        });

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "User" CASCADE');
        await repository.query('TRUNCATE TABLE "Organization" CASCADE');
        await repository.query('TRUNCATE TABLE "Membership" CASCADE');
        await app.close();
    });

    describe('getMembership', () => {
        it('should return a membership', async () => {
            const query = gql`
                query getMembership($id: String!) {
                    membership(id: $id) {
                        id
                        canEdit
                    }
                }
            `;

            const variables = {
                id: membership.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                //.expect(200)
                .expect(async ({ body }) => {
                    console.log(body);
                    expect(body.data.membership.id).toBeDefined();
                    expect(body.data.membership.canEdit).toBeFalsy();
                });
        });
    });

    describe('createMembership', () => {
        it('should create a membership', async () => {
            user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            const query = gql`
                mutation createMembership($input: CreateMembershipInput!) {
                    createMembership(input: $input) {
                        id
                        canEdit
                    }
                }
            `;

            const variables = {
                input: {
                    organizationId: organization.id,
                    userId: user.id,
                    canEdit: true,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createMembership.id).toBeDefined();
                    expect(body.data.createMembership.canEdit).toBeTruthy();
                });
        });
    });

    describe('updateMembership', () => {
        it('should update a membership', async () => {
            user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            membership = await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
            });

            const query = gql`
                mutation updateMembership($input: UpdateMembershipInput!) {
                    updateMembership(input: $input) {
                        id
                        canEdit
                    }
                }
            `;

            const variables = {
                input: {
                    id: membership.id,
                    canEdit: true,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateMembership).toEqual({
                        id: expect.any(String),
                        canEdit: true,
                    });
                });
        });
    });

    describe('acceptMembership', () => {
        it('should accept a membership request', async () => {
            user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            membership = await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
            });

            const query = gql`
                mutation acceptMembership($input: MembershipRequestInput!) {
                    acceptMembership(input: $input)
                }
            `;

            const variables = {
                input: {
                    userId: user.id,
                    organizationId: organization.id,
                    inviteCode: membership.inviteCode,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.acceptMembership).toBeTruthy();
                });
        });
    });

    describe('declineMembership', () => {
        it('should accept a membership request', async () => {
            user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: owner,
            });

            membership = await service.createMembership({
                organizationId: organization.id,
                userId: user.id,
            });

            const query = gql`
                mutation declineMembership($input: MembershipRequestInput!) {
                    declineMembership(input: $input)
                }
            `;
            const variables = {
                input: {
                    userId: user.id,
                    organizationId: organization.id,
                    inviteCode: membership.inviteCode,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.declineMembership).toBeTruthy();
                });
        });
    });

    describe('deleteMembership', () => {
        it('should delete a membership', async () => {
            const query = gql`
                mutation deleteMembership($input: DeleteMembershipInput!) {
                    deleteMembership(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: membership.id,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                //.expect(200)
                .expect(({ body }) => {
                    console.log(body);
                    expect(body.data.deleteMembership).toBeTruthy();
                });
        });
    });
});
