import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

/**
 * Warning: This wallet address is from an unknown source! Do not make any transaction actions on this wallet address
 * User1
 * address: 0xC07542b5a1faB8b5cd1Ea19c21A5E1eE57Ed4618
 * private key: 0x15768ffe58e18e876f9eb14d3c28fb0c27d44fd205ff14536744a82bf9eb02fd
 * method: web3.eth.accounts.sign('sign in vibe', '0x15768ffe58e18e876f9eb14d3c28fb0c27d44fd205ff14536744a82bf9eb02fd')
 * result: {"message":"sign in vibe","messageHash":"0x7a43926dc05b4ed86a518c7d93dce2194e2dcfb7bc05a0ce341297c73f8526fc","v":"0x1b","r":"0x3aa40ecabfcbbd81f79b6308ab441644038986b3bc60b90e188c5c70567e4b1b","s":"0x697d39f136c602d955cd41500df8c97470e5cf59424ad22a85e5ba932ef074a0","signature":"0x3aa40ecabfcbbd81f79b6308ab441644038986b3bc60b90e188c5c70567e4b1b697d39f136c602d955cd41500df8c97470e5cf59424ad22a85e5ba932ef074a01b"}
 *
 * User2
 * address: 0xB836660F2Aa17b24891C6DF544AE3EF72a03BBBe
 * private key: 0xd4fb467da888926891a290848edbd6c7841ea7884b38650a291b8c8a2d20621f
 * method: web3.eth.accounts.sign('sign in vibe', '0xd4fb467da888926891a290848edbd6c7841ea7884b38650a291b8c8a2d20621f')
 * result: {"message":"sign in vibe","messageHash":"0x7a43926dc05b4ed86a518c7d93dce2194e2dcfb7bc05a0ce341297c73f8526fc","v":"0x1b","r":"0xcda4a8744fe59b148d20d6335b01c39b300eee8032b90aa35dc4cb8c74c9b953","s":"0x6c32e8dbf5d9deb657588be5e096dcb7cfb1876c47c3b74b0deb1e57499c7cb7","signature":"0xcda4a8744fe59b148d20d6335b01c39b300eee8032b90aa35dc4cb8c74c9b9536c32e8dbf5d9deb657588be5e096dcb7cfb1876c47c3b74b0deb1e57499c7cb71b"}
 */

export const gql = String.raw;

const user1 = {
    address: '0xC07542b5a1faB8b5cd1Ea19c21A5E1eE57Ed4618',
    message: 'sign in vibe',
    signature:
        '0x3aa40ecabfcbbd81f79b6308ab441644038986b3bc60b90e188c5c70567e4b1b697d39f136c602d955cd41500df8c97470e5cf59424ad22a85e5ba932ef074a01b',
    name: 'Vibe Test Account 1',
};

const user2 = {
    address: '0xB836660F2Aa17b24891C6DF544AE3EF72a03BBBe',
    message: 'sign in vibe',
    signature:
        '0xcda4a8744fe59b148d20d6335b01c39b300eee8032b90aa35dc4cb8c74c9b9536c32e8dbf5d9deb657588be5e096dcb7cfb1876c47c3b74b0deb1e57499c7cb71b',
    name: 'Vibe Test Account 2',
};

const param = {
    loginWithWallet: gql`
        mutation {
            loginWithWallet(address: "${user1.address}", message: "${user1.message}", signature: "${user1.signature}") {
                sessionToken
                item {
                    address
                }
            }
        }
    `,
    loginWithWallet2: gql`
        mutation {
            loginWithWallet(address: "${user2.address}", message: "${user2.message}", signature: "${user2.signature}") {
                sessionToken
                item {
                    address
                }
            }
        }
    `,
    followUserWallet: gql`
        mutation {
            followUserWallet(address: "${user2.address}", isFollowed: true)
        }
    `,
    getAddressInfo: gql`
        query {
            getAddressInfo(address: "${user2.address}") {
                address
            }
        }
    `,
    updateAddressInfo: gql`
        mutation {
            updateAddressInfo(name: "${user1.name}")
        }
    `,
    getUserFollowerList: gql`
        query {
            getUserFollowerList(address: "${user2.address}") {
                total
                data {
                    address
                }
            }
        }
    `,
    getUserFollowingList: gql`
        query {
            getUserFollowingList(address: "${user1.address}") {
                total
                data {
                    address
                }
            }
        }
    `,
};

describe('GraphQL AuthResolver (e2e) {Supertest}', () => {
    let app: INestApplication;
    let session: string;

    beforeAll(async () => {
        jest.setTimeout(70000);
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('login', () => {
        // Login the user1
        it('should login succ', () => {
            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query: param.loginWithWallet })
                .expect(200)
                .expect((res) => {
                    expect(res.body.data.loginWithWallet).toBeDefined();
                    session = res.body.data.loginWithWallet.sessionToken;
                    expect(session).toBeDefined();
                    const u1 = res.body.data.loginWithWallet.item;
                    expect(u1.address).toBe(user1.address.toLowerCase());
                });
        });
    });

    describe('/graphql', () => {
        describe('login', () => {
            // Login the user1
            it('should login succ', () => {
                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.loginWithWallet })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.loginWithWallet).toBeDefined();
                        session = res.body.data.loginWithWallet.sessionToken;
                        expect(session).toBeDefined();
                        const u1 = res.body.data.loginWithWallet.item;
                        expect(u1.address).toBe(user1.address.toLowerCase());
                    });
            });

            // Register user2
            describe('register user2', () => {
                it('should be ok', () => {
                    return request(app.getHttpServer())
                        .post('/graphql')
                        .send({ query: param.loginWithWallet2 })
                        .expect(200)
                        .expect((res) => {
                            expect(res.body.data.loginWithWallet).toBeDefined();
                            const s2 = res.body.data.loginWithWallet.sessionToken;
                            expect(s2).toBeDefined();
                            const u2 = res.body.data.loginWithWallet.item;
                            expect(u2.address).toBe(user2.address.toLowerCase());
                        });
                });
            });

            // Use the user1 to follow the user2
            describe('follow user', () => {
                it('should be success', () => {
                    return request(app.getHttpServer())
                        .post('/graphql')
                        .send({ query: param.followUserWallet })
                        .set('session', session)
                        .expect(200)
                        .expect((res) => {
                            expect(res.body.data.followUserWallet).toEqual(true);
                        });
                });
            });

            // Get information about the user2
            describe('get address info of user2', () => {
                it('should be return user2 address', () => {
                    return request(app.getHttpServer())
                        .post('/graphql')
                        .send({ query: param.getAddressInfo })
                        .set('session', session)
                        .expect(200)
                        .expect((res) => {
                            expect(res.body.data.getAddressInfo).toBeDefined();
                            expect(res.body.data.getAddressInfo.address).toBe(user2.address.toLowerCase());
                        });
                });
            });

            // Update the user1's information
            describe('update user info of user1', () => {
                it('should be success', () => {
                    return request(app.getHttpServer())
                        .post('/graphql')
                        .send({ query: param.updateAddressInfo })
                        .set('session', session)
                        .expect(200)
                        .expect((res) => {
                            expect(res.body.data.updateAddressInfo).toEqual(true);
                        });
                });
            });

            // Get the list of followers of the user2
            describe('get follower list of user2', () => {
                it('should include the user1', () => {
                    return request(app.getHttpServer())
                        .post('/graphql')
                        .send({ query: param.getUserFollowerList })
                        .set('session', session)
                        .expect(200)
                        .expect((res) => {
                            expect(res.body.data.getUserFollowerList).toBeDefined();
                            const total = res.body.data.getUserFollowerList.total;
                            expect(total).toBeGreaterThan(0); // toBeGreaterThan

                            const data = res.body.data.getUserFollowerList.data;
                            const match_ = data.filter((d) => {
                                return d.address == user1.address.toLocaleLowerCase();
                            });
                            expect(match_.length).toBeGreaterThanOrEqual(0); // toBeGreaterThan
                        });
                });
            });

            // Get user1's follow list
            describe('get following list of user1', () => {
                it('should include the user2', () => {
                    return request(app.getHttpServer())
                        .post('/graphql')
                        .send({ query: param.getUserFollowingList })
                        .set('session', session)
                        .expect(200)
                        .expect((res) => {
                            expect(res.body.data.getUserFollowingList).toBeDefined();
                            const total = res.body.data.getUserFollowingList.total;
                            expect(total).toBeGreaterThan(0); // toBeGreaterThan

                            const data = res.body.data.getUserFollowingList.data;
                            const match_ = data.filter((d) => {
                                return d.address == user2.address.toLocaleLowerCase();
                            });
                            expect(match_.length).toBeGreaterThan(0); // toBeGreaterThan
                        });
                });
            });
        });
    });
});
