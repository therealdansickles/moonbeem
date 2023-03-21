import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

/**
 * Warning: This wallet address is from an unknown source! Do not make any transaction actions on this wallet address
 * address: 0xC07542b5a1faB8b5cd1Ea19c21A5E1eE57Ed4618
 * private key: 0x15768ffe58e18e876f9eb14d3c28fb0c27d44fd205ff14536744a82bf9eb02fd
 * method: web3.eth.accounts.sign('sign in vibe', '0x15768ffe58e18e876f9eb14d3c28fb0c27d44fd205ff14536744a82bf9eb02fd')
 * result: {"message":"sign in vibe","messageHash":"0x7a43926dc05b4ed86a518c7d93dce2194e2dcfb7bc05a0ce341297c73f8526fc","v":"0x1b","r":"0x3aa40ecabfcbbd81f79b6308ab441644038986b3bc60b90e188c5c70567e4b1b","s":"0x697d39f136c602d955cd41500df8c97470e5cf59424ad22a85e5ba932ef074a0","signature":"0x3aa40ecabfcbbd81f79b6308ab441644038986b3bc60b90e188c5c70567e4b1b697d39f136c602d955cd41500df8c97470e5cf59424ad22a85e5ba932ef074a01b"}
 */

export const gql = String.raw;

const user = {
    address: '0xC07542b5a1faB8b5cd1Ea19c21A5E1eE57Ed4618',
    message: 'sign in vibe',
    signature: '0x3aa40ecabfcbbd81f79b6308ab441644038986b3bc60b90e188c5c70567e4b1b697d39f136c602d955cd41500df8c97470e5cf59424ad22a85e5ba932ef074a01b',
};

const param = {
    loginWithWallet: gql`
        mutation {
            loginWithWallet(address: "${user.address}", message: "${user.message}", signature: "${user.signature}") {
                sessionToken
                item {
                    address
                }
            }
        }
    `,
    logoutWallet: gql`
        mutation {
            logoutWallet
        }
    `,
};

describe('GraphQL AuthResolver (e2e) {Supertest}', () => {
    let app: INestApplication;
    let session: string;

    beforeAll(async () => {
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
        // check if the wallet login works
        describe('loginWithWallet', () => {
            it('should be ok', () => {
                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.loginWithWallet })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.loginWithWallet).toBeDefined();
                        session = res.body.data.loginWithWallet.sessionToken;
                        expect(session).toBeDefined();
                        const user = res.body.data.loginWithWallet.item;
                        expect(user.address).toBe(user.address.toLowerCase());
                    });
            });
        });

        // check if the wallet logout works
        describe('logoutWallet', () => {
            it('should be ok', () => {
                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.logoutWallet })
                    .set('session', session)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.logoutWallet).toEqual(true);
                    });
            });
        });
    });
});
