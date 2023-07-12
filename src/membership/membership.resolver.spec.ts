import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { hashSync as hashPassword } from 'bcryptjs';
import { MembershipService } from './membership.service';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';

export const gql = String.raw;

describe('MembershipResolver', () => {
    let app: INestApplication;
    let service: MembershipService;
    let organizationService: OrganizationService;
    let userService: UserService;

    beforeAll(async () => {
        app = global.app;

        service = global.membershipService;
        userService = global.userService;
        organizationService = global.organizationService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getMembership', () => {
        it('should return a membership', async () => {
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
        it('should create a membership', async () => {
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
                    password: await hashPassword(owner.password, 10),
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

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
                .auth(token, { type: 'bearer' })
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
                    password: await hashPassword(owner.password, 10),
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

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
                .auth(token, { type: 'bearer' })
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
        it('should will forbid if not signed in', async () => {
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
                    expect(body.errors[0].extensions.code).toEqual('FORBIDDEN');
                    expect(body.data).toBeNull();
                });
        });

        it('should accept membership', async () => {
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
                    password: await hashPassword(user.password, 10),
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

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
                    password: await hashPassword(owner.password, 10),
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

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
                    password: await hashPassword(owner.password, 10),
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

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
                .auth(token, { type: 'bearer' })
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
                owner: anotherUser,
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
