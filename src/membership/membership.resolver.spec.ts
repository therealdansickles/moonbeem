import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { MembershipService } from './membership.service';
import { createOrganization, getToken } from '../test-utils';
import { Repository } from 'typeorm';
import { Membership } from './membership.entity';

export const gql = String.raw;

describe('MembershipResolver', () => {
    let app: INestApplication;
    let service: MembershipService;
    let organizationService: OrganizationService;
    let userService: UserService;
    let membershipRepository: Repository<Membership>;

    beforeAll(async () => {
        app = global.app;

        service = global.membershipService;
        userService = global.userService;
        organizationService = global.organizationService;
        membershipRepository = global.membershipRepository;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getMembership', () => {
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

        it('should return a membership', async () => {
            const membership = await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            const query = gql`
                query getMembership($id: String!) {
                    membership(id: $id) {
                        id
                        canEdit
                        role
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
                id: membership[0].id,
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

        it('should return a membership haven not added role', async () => {
            const membership = await membershipRepository.save({
                organization: organization,
                user: user,
                canEdit: false,
                canManage: false,
                canDeploy: false,
            });

            const query = gql`
                query getMembership($id: String!) {
                    membership(id: $id) {
                        id
                        canEdit
                        role
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
                    expect(body.data.membership.role).toEqual('member');
                    expect(body.data.membership.organization.id).not.toBeNull();
                    expect(body.data.membership.organization.owner.id).not.toBeNull();
                });
        });
    });

    describe('createMembership', () => {
        it('should create a membership', async () => {
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

            const tokenQuery = gql`
                mutation CreateSessionFromEmail($input: CreateSessionFromEmailInput!) {
                    createSessionFromEmail(input: $input) {
                        token
                        user {
                            id
                            email
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    email: owner.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const query = gql`
                mutation createMembership($input: CreateMembershipInput!) {
                    createMembership(input: $input) {
                        id
                        canEdit
                        role
                    }
                }
            `;

            const variables = {
                input: {
                    organizationId: organization.id,
                    emails: [user.email],
                    canEdit: true,
                    role: 'admin',
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createMembership).toBeDefined();
                    expect(body.data.createMembership.length).toBe(1);
                    expect(body.data.createMembership[0].id).toBeDefined();
                    expect(body.data.createMembership[0].canEdit).toBeTruthy();
                    expect(body.data.createMembership[0].role).toEqual('admin');
                });
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

            const tokenQuery = gql`
                mutation CreateSessionFromEmail($input: CreateSessionFromEmailInput!) {
                    createSessionFromEmail(input: $input) {
                        token
                        user {
                            id
                            email
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    email: owner.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const query = gql`
                mutation updateMembership($input: UpdateMembershipInput!) {
                    updateMembership(input: $input) {
                        id
                        canEdit
                        role
                    }
                }
            `;

            const variables = {
                input: {
                    id: membership[0].id,
                    canEdit: true,
                    role: 'admin',
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect((result) => {
                    const body = result.body;
                    expect(body.data.updateMembership).toEqual({
                        id: expect.any(String),
                        canEdit: true,
                        role: 'admin',
                    });
                });
        });
    });

    describe('acceptMembership', () => {
        it('should will forbid if not signed in', async () => {
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

            const query = gql`
                mutation acceptMembership($input: MembershipRequestInput!) {
                    acceptMembership(input: $input)
                }
            `;

            const variables = {
                input: {
                    email: user.email,
                    organizationId: organization.id,
                    inviteCode: membership[0].inviteCode,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].extensions.code).toEqual('FORBIDDEN');
                    expect(body.data).toBeNull();
                });
        });

        it('should accept membership', async () => {
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

            const tokenQuery = gql`
                mutation CreateSessionFromEmail($input: CreateSessionFromEmailInput!) {
                    createSessionFromEmail(input: $input) {
                        token
                        user {
                            id
                            email
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    email: user.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const query = gql`
                mutation acceptMembership($input: MembershipRequestInput!) {
                    acceptMembership(input: $input)
                }
            `;

            const variables = {
                input: {
                    email: user.email,
                    organizationId: organization.id,
                    inviteCode: membership[0].inviteCode,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.acceptMembership).toBeTruthy();
                });
        });
    });

    describe('declineMembership', () => {
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

            const tokenQuery = gql`
                mutation CreateSessionFromEmail($input: CreateSessionFromEmailInput!) {
                    createSessionFromEmail(input: $input) {
                        token
                        user {
                            id
                            email
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    email: owner.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const query = gql`
                mutation declineMembership($input: MembershipRequestInput!) {
                    declineMembership(input: $input)
                }
            `;
            const variables = {
                input: {
                    email: user.email,
                    organizationId: organization.id,
                    inviteCode: membership[0].inviteCode,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.declineMembership).toBeTruthy();
                });
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

            const organization = await createOrganization(organizationService, {
                owner: owner,
            });

            const membership = await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            const token = await getToken(app, owner.email);
            const query = gql`
                mutation deleteMembership($input: DeleteMembershipInput!) {
                    deleteMembership(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: membership[0].id,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.deleteMembership).toBeTruthy();
                });
        });

        it('should not be able to delete owner from memberships', async () => {
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

            const organization = await createOrganization(organizationService, {
                owner: owner,
            });

            await service.createMemberships({
                organizationId: organization.id,
                emails: [user.email],
            });

            const ownerMembership = (await service.getMembershipsByUserId(owner.id))[0];
            const token = await getToken(app, owner.email);

            const query = gql`
                mutation deleteMembership($input: DeleteMembershipInput!) {
                    deleteMembership(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: ownerMembership.id,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].message).toEqual('Forbidden resource');
                    expect(body.errors[0].extensions.response.statusCode).toEqual(403);
                });
        });
    });

    describe('memberships', () => {
        it('should get a membership list', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const anotherUser = await userService.createUser({
                email: faker.internet.email(),
                username: faker.internet.userName(),
                password: 'password',
            });

            const organization1 = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                owner: anotherUser,
            });

            const membership1 = await service.createMembership(user.email, {
                organization: organization1,
                canDeploy: true,
                canManage: true,
            });

            const organization2 = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                owner: anotherUser,
            });

            const membership2 = await service.createMembership(user.email, {
                organization: organization2,
                canDeploy: true,
                canManage: false,
                role: 'admin',
            });

            const query = gql`
                query memberships($userId: String!) {
                    memberships(userId: $userId) {
                        id
                        canDeploy
                        canManage
                        role
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
                    expect(membershipForOrg1.role).toEqual('member');
                    expect(membershipForOrg1.organization.name).toEqual(organization1.name);
                    expect(membershipForOrg1.organization.displayName).toEqual(organization1.displayName);
                    expect(membershipForOrg1.organization.kind).toEqual(organization1.kind);
                    expect(membershipForOrg2.canDeploy).toEqual(true);
                    expect(membershipForOrg2.canManage).toEqual(false);
                    expect(membershipForOrg2.role).toEqual('admin');
                    expect(membershipForOrg2.organization.name).toEqual(organization2.name);
                });
        });
    });
});
