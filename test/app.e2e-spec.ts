import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication } from '@nestjs/common';

export const gql = String.raw;

const param = {
    getHealth: gql`
        query {
            getHealth
        }
    `,
    getTxStatus: gql`
        query {
            getTxStatus(chain: "1", txHash: "0xcf2bbaa29f64272949a4ac7395e6d02078175761149b764172f5ca01c84065b6")
        }
    `,
};

describe('GraphQL AppResolver (e2e) {Supertest}', () => {
    let app: INestApplication;

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
        // check if health is normal
        describe('getHealth', () => {
            it('it should be return ok', () => {
                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.getHealth })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.getHealth).toEqual('ok');
                    });
            });
        });

        // check if the txStatus is normal
        describe('getTxStatus', () => {
            it('it should be return true', () => {
                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.getTxStatus })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.getTxStatus).toEqual(true);
                    });
            });
        });
    });
});
