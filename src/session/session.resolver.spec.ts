import { ethers } from 'ethers';
import { Organization } from 'src/organization/organization.entity';
import * as request from 'supertest';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { UserService } from '../user/user.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletService } from '../wallet/wallet.service';

const gql = String.raw;

describe('SessionResolver', () => {
    let app: INestApplication;
    let userService: UserService;
    let walletService: WalletService;
    let walletRepository: Repository<Wallet>;
    let organizationRepository: Repository<Organization>;

    beforeAll(async () => {
        app = global.app;
        userService = global.userService;
        walletRepository = global.walletRepository;
        walletService = global.walletService;
        organizationRepository = global.organizationRepository;
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

        it("should won't create new user if user doesn't exist but `createUser` doesn't equals to true", async () => {
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
                .expect(async ({ body }) => {
                    expect(body.data.createSession.token).toBeDefined();
                    expect(body.data.createSession.wallet.address).toEqual(wallet.address.toLowerCase());
                    const walletInfo = await walletRepository.findOne({ where: { address: wallet.address.toLowerCase() }, relations: ['owner'] });
                    expect(walletInfo.owner).toBeFalsy();
                });
        });

        it("should create a new user if user doesn't exist and `createUser` equals to true", async () => {
            const wallet = await ethers.Wallet.createRandom();
            const message = 'in test';
            const signature = await wallet.signMessage(message);

            const query = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        user {
                            id
                            username
                        }
                        wallet {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                    createUser: true,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(async ({ body }) => {
                    expect(body.data.createSession.token).toBeDefined();
                    const walletInfo = await walletRepository.findOne({ where: { address: wallet.address.toLowerCase() }, relations: ['owner'] });
                    expect(walletInfo.owner).toBeTruthy();
                    expect(walletInfo.owner.email).toMatch(/\S*@no-reply.vibe.xyz/);
                    expect(body.data.createSession.user.id).toEqual(walletInfo.owner.id);
                    const orgInfo = await organizationRepository.findOneBy({ owner: { id: walletInfo.owner.id } });
                    expect(orgInfo).toBeTruthy();
                    // still will return the wallet info
                    expect(body.data.createSession.wallet).toBeTruthy();
                    expect(body.data.createSession.wallet.id).toEqual(walletInfo.id);
                });
        });

        it('should return the existed user if the wallet has been bound to', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });
            const walletEntity = ethers.Wallet.createRandom();
            const message = 'in test';
            const signature = await walletEntity.signMessage(message);
            const wallet = await walletService.createWallet({
                ownerId: user.id,
                address: walletEntity.address,
            });

            const query = gql`
                mutation CreateSession($input: CreateSessionInput!) {
                    createSession(input: $input) {
                        token
                        user {
                            id
                            username
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    address: wallet.address,
                    message,
                    signature,
                    createUser: true,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(async ({ body }) => {
                    expect(body.data.createSession.token).toBeDefined();
                    expect(body.data.createSession.user.id).toEqual(user.id);
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
