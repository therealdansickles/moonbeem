import { ethers } from 'ethers';
import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { WaitlistService } from './waitlist.service';

export const gql = String.raw;

describe('WaitlistResolver', () => {
    let service: WaitlistService;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.waitlistService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getWaitlist', () => {
        it('should get a waitlist item by email', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            await service.createWaitlist({
                email,
                address: randomWallet.address,
                message,
                signature,
            });

            const query = gql`
                query getWaitlist($input: GetWaitlistInput!) {
                    getWaitlist(input: $input) {
                        id
                        email
                        seatNumber
                        address
                    }
                }
            `;

            const variables = {
                input: {
                    email,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.getWaitlist.email).toEqual(email.toLowerCase());
                    expect(body.data.getWaitlist.address).toEqual(randomWallet.address.toLowerCase());
                });
        });

        it('should get a waitlist item by address', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            await service.createWaitlist({
                email,
                address: randomWallet.address,
                message,
                signature,
            });

            const query = gql`
                query getWaitlist($input: GetWaitlistInput!) {
                    getWaitlist(input: $input) {
                        id
                        email
                        seatNumber
                        address
                    }
                }
            `;

            const variables = {
                input: {
                    address: randomWallet.address,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.getWaitlist.email).toEqual(email.toLowerCase());
                    expect(body.data.getWaitlist.address).toEqual(randomWallet.address.toLowerCase());
                });
        });
    });

    describe('createWaitlist', () => {
        it('should create a waitlist item by email', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const tokenQuery = gql`
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

            const tokenVariables = {
                input: {
                    address: randomWallet.address,
                    message,
                    signature,
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSession;

            const query = gql`
                mutation CreateWaitlist($input: CreateWaitlistInput!) {
                    createWaitlist(input: $input) {
                        id
                        email
                        seatNumber
                        kind
                    }
                }
            `;

            const variables = {
                input: {
                    email,
                    address: randomWallet.address,
                    message,
                    signature,
                    kind: faker.hacker.noun(),
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createWaitlist.email).toEqual(email);
                    expect(body.data.createWaitlist.id).toBeDefined();
                    expect(body.data.createWaitlist.seatNumber).toBeDefined();
                    expect(body.data.createWaitlist.kind).toEqual(variables.input.kind);
                });
        });

        it('should not create a waitlist item with wrong signature', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const randomWallet2 = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const tokenQuery = gql`
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

            const tokenVariables = {
                input: {
                    address: randomWallet.address,
                    message,
                    signature,
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSession;

            const query = gql`
                mutation CreateWaitlist($input: CreateWaitlistInput!) {
                    createWaitlist(input: $input) {
                        id
                        email
                        seatNumber
                    }
                }
            `;

            const variables = {
                input: {
                    email,
                    address: randomWallet2.address,
                    message,
                    signature,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors).toBeDefined();
                    expect(body.errors[0].message).toEqual('signature verification failure');
                });
        });
    });

    describe('claimWaitlist', () => {
        it('should forbid if not signed in', async () => {
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            const query = gql`
                mutation ClaimWaitlist($input: ClaimWaitlistInput!) {
                    claimWaitlist(input: $input)
                }
            `;

            const variables = {
                input: {
                    address: randomWallet.address,
                    message,
                    signature,
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

        it('should successfully claim a waitlist item by address', async () => {
            const email = faker.internet.email();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await randomWallet.signMessage(message);

            await service.createWaitlist({
                email,
                address: randomWallet.address,
                signature,
                message,
            });

            const tokenQuery = gql`
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

            const tokenVariables = {
                input: {
                    address: randomWallet.address,
                    message,
                    signature,
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSession;

            const query = gql`
                mutation ClaimWaitlist($input: ClaimWaitlistInput!) {
                    claimWaitlist(input: $input)
                }
            `;

            const variables = {
                input: {
                    address: randomWallet.address,
                    message,
                    signature,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.claimWaitlist).toBeTruthy();
                });
        });
    });
});
