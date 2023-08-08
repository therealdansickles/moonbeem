import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { OrganizationService } from './organization.service';

export const gql = String.raw;

describe('OrganizationResolver', () => {
    let service: OrganizationService;
    let userService: UserService;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.organizationService;
        userService = global.userService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('organization', () => {
        it('should return an organization', async () => {
            const newOwner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const newOrganization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: newOwner,
            });

            const query = gql`
                query GetOrg($id: String!) {
                    organization(id: $id) {
                        id

                        collections {
                            id
                        }

                        memberships {
                            id
                        }

                        collaborations {
                            id
                        }
                    }
                }
            `;

            const variables = {
                id: newOrganization.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.organization.id).toEqual(newOrganization.id);
                    expect(body.data.organization.collections).toBeDefined();
                    expect(body.data.organization.memberships).toBeDefined();
                    expect(body.data.organization.collaborations).toBeDefined();
                });
        });
    });

    describe('createOrganization', () => {
        it('should forbid if not signed in', async () => {
            const query = gql`
                mutation CreateOrganization($input: CreateOrganizationInput!) {
                    createOrganization(input: $input) {
                        id
                        name
                    }
                }
            `;

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const variables = {
                input: {
                    name: faker.company.name(),
                    displayName: faker.company.name(),
                    about: faker.company.catchPhrase(),
                    avatarUrl: faker.image.url(),
                    backgroundUrl: faker.image.url(),
                    websiteUrl: faker.internet.url(),
                    twitter: faker.internet.userName(),
                    instagram: faker.internet.userName(),
                    discord: faker.internet.userName(),
                    owner: {
                        id: owner.id,
                    },
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].extensions.code).toEqual('FORBIDDEN');
                    expect(body.data).toBeNull();
                });
        });

        it('should allow authenticated users to create an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
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

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const query = gql`
                mutation CreateOrganization($input: CreateOrganizationInput!) {
                    createOrganization(input: $input) {
                        id
                        name
                    }
                }
            `;

            const variables = {
                input: {
                    name: faker.company.name(),
                    displayName: faker.company.name(),
                    about: faker.company.catchPhrase(),
                    avatarUrl: faker.image.url(),
                    backgroundUrl: faker.image.url(),
                    websiteUrl: faker.internet.url(),
                    twitter: faker.internet.userName(),
                    instagram: faker.internet.userName(),
                    discord: faker.internet.userName(),
                    owner: {
                        id: owner.id,
                    },
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createOrganization.name).toEqual(variables.input.name);
                });
        });
    });

    describe('updateOrganization', () => {
        it('should update an organization', async () => {
            const newOwner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const newOrganization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: newOwner,
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
                    email: newOwner.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const query = gql`
                mutation updateOrganization($input: UpdateOrganizationInput!) {
                    updateOrganization(input: $input) {
                        displayName
                    }
                }
            `;

            const variables = {
                input: {
                    id: newOrganization.id,
                    displayName: faker.company.name(),
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateOrganization.displayName).toEqual(variables.input.displayName);
                });
        });
    });

    describe('deleteOrganization', () => {
        it('should delete an organization', async () => {
            const newOwner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const newOrganization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: newOwner,
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
                    email: newOwner.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const query = gql`
                mutation deleteOrganization($input: OrganizationInput!) {
                    deleteOrganization(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: newOrganization.id,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.deleteOrganization).toBeTruthy();
                });
        });
    });

    describe('transferOrganization', () => {
        it('should transfer an organization', async () => {
            const oldOwner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const newOwner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const transferedOrganization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: {
                    id: oldOwner.id,
                },
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
                    email: oldOwner.email,
                    password: 'password',
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;
            const query = gql`
                mutation transferOrganization($input: TransferOrganizationInput!) {
                    transferOrganization(input: $input) {
                        owner {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    id: transferedOrganization.id,
                    ownerId: newOwner.id,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.transferOrganization.owner.id).toEqual(newOwner.id);
                });
        });
    });
});
