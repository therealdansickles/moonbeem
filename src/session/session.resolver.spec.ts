import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import { ethers } from 'ethers';
import { UserService } from '../user/user.service';

const gql = String.raw;

describe('SessionResolver', () => {
    let app: INestApplication;
    let userService: UserService;

    beforeAll(async () => {
        app = global.app;
        userService = global.userService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('createSession', () => {
        it('should create a session', async () => {
            const wallet = await ethers.Wallet.createRandom();
            const message = 'in test';
            const signature = await wallet.signMessage(message);

            const query = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        wallet {
                            id
                            address
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createSession.token).toBeDefined();
                    expect(body.data.createSession.wallet.address).toEqual(wallet.address.toLowerCase());
                });
        });
    });

    describe('createSession', () => {
        it('should create a session', async () => {
            const wallet = await ethers.Wallet.createRandom();
            const message = 'in test';
            const signature = await wallet.signMessage(message);

            const query = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        wallet {
                            id
                            address
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createSession.token).toBeDefined();
                    expect(body.data.createSession.wallet.address).toEqual(wallet.address.toLowerCase());
                });
        });
    });

    describe('createSessionFromEmail', () => {
        it('should create a session', async () => {
            const user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const query = gql`
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

            const variables = {
                input: {
                    email: user.email,
                    password: 'password',
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createSessionFromEmail.token).toBeDefined();
                    expect(body.data.createSessionFromEmail.user.email).toEqual(user.email);
                });
        });
    });
});
