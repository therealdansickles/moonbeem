import { ethers } from 'ethers';
import * as request from 'supertest';
import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';
import { WalletService } from '../wallet/wallet.service';
import { RelationshipService } from './relationship.service';

export const gql = String.raw;

describe('RelationshipResolver', () => {
    let service: RelationshipService;
    let walletService: WalletService;
    let app: INestApplication;

    beforeAll(async () => {
        app = global.app;
        service = global.relationshipService;
        walletService = global.walletService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('followByAddress', () => {
        it('should forbid if not signed in', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            const query = gql`
                mutation FollowByAddress($input: CreateRelationshipByAddressInput!) {
                    followByAddress(input: $input) {
                        id
                        follower {
                            address
                        }
                        following {
                            address
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    followerAddress: wallet2.address,
                    followingAddress: wallet1.address,
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

        it('should work', async () => {
            const walletEntity = await ethers.Wallet.createRandom();
            const wallet1 = await walletService.createWallet({ address: walletEntity.address });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const message = 'follow';
            const signature = await walletEntity.signMessage(message);

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
                    address: wallet1.address,
                    message,
                    signature,
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSession;

            const query = gql`
                mutation FollowByAddress($input: CreateRelationshipByAddressInput!) {
                    followByAddress(input: $input) {
                        id
                        follower {
                            address
                        }
                        following {
                            address
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    followerAddress: wallet2.address,
                    followingAddress: wallet1.address,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.followByAddress.id).toBeTruthy();
                    expect(body.data.followByAddress.follower.address).toEqual(wallet2.address.toLowerCase());
                    expect(body.data.followByAddress.following.address).toEqual(wallet1.address.toLowerCase());
                });
        });
    });

    describe('unfollowByAddress', () => {
        it('should work', async () => {
            const walletEntity = await ethers.Wallet.createRandom();
            const wallet1 = await walletService.createWallet({ address: walletEntity.address });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const message = 'follow';
            const signature = await walletEntity.signMessage(message);

            await service.createRelationshipByAddress({
                followerAddress: wallet1.address,
                followingAddress: wallet2.address,
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
                    address: wallet1.address,
                    message,
                    signature,
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSession;

            const query = gql`
                mutation UnfollowByAddress($input: DeleteRelationshipByAddressInput!) {
                    unfollowByAddress(input: $input)
                }
            `;

            const variables = {
                input: {
                    followerAddress: wallet1.address,
                    followingAddress: wallet2.address,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.unfollowByAddress).toBeTruthy();
                });
        });
    });

    describe('getFollowers', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await service.createRelationshipByAddress({
                followingAddress: wallet1.address,
                followerAddress: wallet2.address,
            });
            await service.createRelationshipByAddress({
                followingAddress: wallet1.address,
                followerAddress: wallet3.address,
            });

            const query = gql`
                query followers($address: String!) {
                    followers(address: $address) {
                        id
                        follower {
                            id
                            address
                        }
                    }
                }
            `;

            const variables = {
                address: wallet1.address,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.followers.length).toEqual(2);
                    expect(body.data.followers[0].follower.address).toEqual(wallet2.address);
                    expect(body.data.followers[1].follower.address).toEqual(wallet3.address);
                });
        });
    });

    describe('getFollowings', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await service.createRelationshipByAddress({
                followingAddress: wallet1.address,
                followerAddress: wallet2.address,
            });
            await service.createRelationshipByAddress({
                followingAddress: wallet1.address,
                followerAddress: wallet3.address,
            });

            const query = gql`
                query followings($address: String!) {
                    followings(address: $address) {
                        id
                        following {
                            id
                            address
                        }
                    }
                }
            `;

            const variables = {
                address: wallet2.address,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.followings.length).toEqual(1);
                    expect(body.data.followings[0].following.address).toEqual(wallet1.address);
                });
        });
    });
});
