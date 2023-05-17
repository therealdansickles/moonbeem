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
    let module: TestingModule;

    beforeEach(async () => {
        module = await Test.createTestingModule({
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
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                MembershipModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [MembershipModule],
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

    afterEach(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('getMembership', () => {
        it('should return a membership', async () => {
            const query = gql`
                query getMembership($id: String!) {
                    membership(id: $id) {
                        id
                        canEdit

                        user {
                            id
                        }

                        organization {
                            id

                            owner {
                                id
                            }
                        }
                    }
                }
            `;

            const variables = {
                id: membership.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(async ({ body }) => {
                    expect(body.data.membership.id).not.toBeNull();
                    expect(body.data.membership.canEdit).toBeFalsy();
                    expect(body.data.membership.user.id).not.toBeNull();
                    expect(body.data.membership.organization.id).not.toBeNull();
                    expect(body.data.membership.organization.owner.id).not.toBeNull();
                });
        });
    });

    describe('createMembership', () => {
        it.only('should create a membership', async () => {
            user = await userService.createUser({
                email: 'user' + faker.internet.email(),
                password: faker.internet.password(),
            });

            const owner = await userService.createUser({
                email: 'owner' + faker.internet.email(),
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

            const memberships = await repository.find();

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
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.deleteMembership).toBeTruthy();
                });
        });
    });

    describe('memberships', () => {
        it('should get a membership list', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const anotherUser = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: faker.internet.password(),
            });

            const organization1 = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: anotherUser,
            });

            const membership1 = await service.createMembership({
                organizationId: organization1.id,
                userId: user.id,
                canDeploy: true,
                canManage: true,
            });

            const organization2 = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                owner: user,
            });

            const membership2 = await service.createMembership({
                organizationId: organization2.id,
                userId: user.id,
                canDeploy: true,
                canManage: false,
            });

            const query = gql`
                query memberships($userId: String!) {
                    memberships(userId: $userId) {
                        id
                        canDeploy
                        canManage

                        organization {
                            name
                            displayName
                            kind
                        }
                    }
                }
            `;

            const variables = {
                userId: user.id,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.memberships.length).toEqual(2);
                    const rs = body.data.memberships;
                    const membershipForOrg1 = rs.find((item) => item.id === membership1.id);
                    const membershipForOrg2 = rs.find((item) => item.id === membership2.id);
                    expect(membershipForOrg1.canDeploy).toEqual(true);
                    expect(membershipForOrg1.canManage).toEqual(true);
                    expect(membershipForOrg1.organization.name).toEqual(organization1.name);
                    expect(membershipForOrg1.organization.displayName).toEqual(organization1.displayName);
                    expect(membershipForOrg1.organization.kind).toEqual(organization1.kind);
                    expect(membershipForOrg2.canDeploy).toEqual(true);
                    expect(membershipForOrg2.canManage).toEqual(false);
                    expect(membershipForOrg2.organization.name).toEqual(organization2.name);
                });
        });
    });
});
