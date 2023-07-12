import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { hashSync as hashPassword } from 'bcryptjs';
import { UserService } from '../user/user.service';

export const gql = String.raw;

describe('UserResolver', () => {
    let service: UserService;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.userService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getUser', () => {
        it('should get an user', async () => {
            const user = await service.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const query = gql`
                query GetUser($id: String!) {
                    user(id: $id) {
                        id
                        email
                        avatarUrl
                        backgroundUrl
                        websiteUrl
                        twitter
                        instagram
                        discord

                        wallets {
                            id
                        }

                        organizations {
                            id
                        }

                        memberships {
                            id
                        }
                    }
                }
            `;

            const variables = { id: user.id };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.user.id).toEqual(user.id);
                    expect(body.data.user.email).toEqual(user.email);
                    expect(body.data.user.avatarUrl).toBeDefined();
                    expect(body.data.user.avatarUrl).toBeDefined();
                    expect(body.data.user.backgroundUrl).toBeDefined();
                    expect(body.data.user.websiteUrl).toBeDefined();
                    expect(body.data.user.twitter).toBeDefined();
                    expect(body.data.user.instagram).toBeDefined();
                    expect(body.data.user.discord).toBeDefined();
                    expect(body.data.user.wallets).toBeDefined();
                    expect(body.data.user.organizations).toBeDefined();
                    expect(body.data.user.memberships).toBeDefined();
                });
        });
    });

    describe('createUser', () => {
        it('should create an user', async () => {
            const query = gql`
                mutation CreateUser($input: CreateUserInput!) {
                    createUser(input: $input) {
                        id
                        email
                        username
                        avatarUrl
                    }
                }
            `;

            const variables = {
                input: {
                    username: faker.internet.userName(),
                    email: faker.internet.email(),
                    password: faker.internet.password(),
                    avatarUrl: faker.internet.avatar(),
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createUser.id).toBeDefined();
                    expect(body.data.createUser.email).toEqual(variables.input.email.toLowerCase());
                    expect(body.data.createUser.username).toEqual(variables.input.username);
                    expect(body.data.createUser.avatarUrl).toEqual(variables.input.avatarUrl);
                });
        });
    });

    describe('updateUser', () => {
        it('should update an user', async () => {
            const user = await service.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
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
                mutation updateUser($input: UpdateUserInput!) {
                    updateUser(input: $input) {
                        id
                        email
                        username
                        avatarUrl
                    }
                }
            `;

            const variables = {
                input: {
                    id: user.id,
                    username: faker.internet.userName(),
                    email: faker.internet.email(),
                    avatarUrl: faker.internet.avatar(),
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateUser.id).toEqual(user.id);
                    expect(body.data.updateUser.email).toEqual(variables.input.email);
                    expect(body.data.updateUser.username).toEqual(variables.input.username);
                    expect(body.data.updateUser.avatarUrl).toEqual(variables.input.avatarUrl);
                });
        });
    });
});
