import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ethers } from 'ethers';
import { Resolver, Query } from '@nestjs/graphql';
import { CurrentWallet } from './session.decorator';
import { Wallet } from '../wallet/wallet.dto';

const gql = String.raw;

@Resolver()
export class TestResolver {
    @Query(() => String)
    test(@CurrentWallet() wallet: Wallet): string {
        return wallet.address;
    }
}

describe('SessionGuard', () => {
    let app: INestApplication;
    beforeAll(async () => {
        app = global.app;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    it('should not authenticate a wallet with an invalid token', async () => {
        const query = gql`
            query Test {
                test
            }
        `;

        return request(app.getHttpServer())
            .post('/graphql')
            .auth('test', { type: 'bearer' })
            .send({ query })
            .expect(200)
            .expect(({ body }) => {
                console.log(body);
                const [err] = body.errors;
                expect(err.message).toEqual('Forbidden resource');
            });
    });

    it('should authenticate a wallet with a valid token', async () => {
        const wallet = ethers.Wallet.createRandom();
        const message = 'welcome to vibe';
        const signature = await wallet.signMessage(message);

        const query = gql`
            mutation CreateSession($input: CreateSessionInput!) {
                createSession(input: $input) {
                    token
                }
            }
        `;

        const input = {
            address: wallet.address,
            message,
            signature,
        };

        const result = await request(app.getHttpServer())
            .post('/graphql')
            .send({ query, variables: { input } })
            .then((resp) => {
                return resp.body.data.createSession;
            });

        const authedQuery = gql`
            query Test {
                test
            }
        `;

        return request(app.getHttpServer())
            .post('/graphql')
            .auth(result.token, { type: 'bearer' })
            .send({ query: authedQuery })
            .expect(200)
            .expect(({ body }) => {
                console.log(`ddd: `, JSON.stringify(body, null, 2));
                const { test } = body.data;
                expect(test).toEqual(wallet.address.toLowerCase());
            });
    });
});
