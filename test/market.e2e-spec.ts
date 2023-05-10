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

const param = {
    getAddressHoldings: gql`
        query {
            getAddressHoldings(address: "${user1.address}") {
                data {
                    token
                    tokenId
                }
                total
            }
        }
    `,
    getAddressActivities: gql`
        query {
            getAddressActivities(address: "${user1.address}") {
                data {
                    nft {
                        token
                        tokenId
                    }
                }
                total
            }
        }
    `,
    getAddressReleased: gql`
        query {
            getAddressReleased(address: "${user1.address}") {
                data {
                    currentPrice {
                        token
                    }
                }
                total
            }
        }
    `,
    getCollectionActivities: gql`
        query {
            getCollectionActivities(address: "${user1.address}") {
                data {
                    token
                    tokenId
                }
                total
            }
        }
    `,
    executeSearch: gql`
        query {
            search(searchTerm: "d", page: 0, pageSize: 3) {
                collections {
                    data {
                        name
                        chainId
                    }
                }
                accounts {
                    data {
                        name
                        address
                    }
                }
            }
        }
    `,
};

describe('GraphQL AuthResolver (e2e) {Supertest}', () => {
    let app: INestApplication;

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

    describe('/graphql', () => {
        describe('getAddressHoldings', () => {
            it('should be success', () => {
                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.getAddressHoldings })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.getAddressHoldings).toBeDefined();
                        const total = res.body.data.getAddressHoldings.total;
                        expect(total).toBeGreaterThanOrEqual(0);
                    });
            });
        });

        describe('getAddressActivities', () => {
            it('should be success', () => {
                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.getAddressActivities })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.getAddressActivities).toBeDefined();
                        const total = res.body.data.getAddressActivities.total;
                        expect(total).toBeGreaterThanOrEqual(0);
                    });
            });
        });

        describe('getAddressReleased', () => {
            it('should be success', () => {
                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.getAddressReleased })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.getAddressReleased).toBeDefined();
                        const total = res.body.data.getAddressReleased.total;
                        expect(total).toBeGreaterThanOrEqual(0);
                    });
            });
        });

        describe('getCollectionActivities', () => {
            it('should be success', () => {
                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.getCollectionActivities })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.getCollectionActivities).toBeDefined();
                        const total = res.body.data.getCollectionActivities.total;
                        expect(total).toBeGreaterThanOrEqual(0);
                    });
            });
        });

        describe('executeSearch', () => {
            it('should return search results', () => {
                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.executeSearch })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.search).toBeDefined();
                        expect(res.body.data.search.collections).toBeDefined();
                        expect(res.body.data.search.accounts).toBeDefined();
                        expect(res.body.data.search.collections.data.length).toBeLessThanOrEqual(3);
                        expect(res.body.data.search.collections.data[0].chainId).toBeDefined();
                    });
            });
        });
    });
});
