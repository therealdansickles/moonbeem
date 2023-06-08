import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { MintSaleTransaction } from './mint-sale-transaction.entity';
import { MintSaleTransactionModule } from './mint-sale-transaction.module';
import { MintSaleTransactionService } from './mint-sale-transaction.service';

export const gql = String.raw;

describe('MintSaleTransactionResolver', () => {
    let service: MintSaleTransactionService;
    let app: INestApplication;
    let transaction: MintSaleTransaction;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                MintSaleTransactionModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [MintSaleTransactionModule],
                }),
            ],
        }).compile();

        service = module.get<MintSaleTransactionService>(MintSaleTransactionService);
        app = module.createNestApplication();

        transaction = await service.createMintSaleTransaction({
            height: parseInt(faker.random.numeric(5)),
            txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
            txTime: Math.floor(faker.date.recent().getTime() / 1000),
            sender: faker.finance.ethereumAddress(),
            recipient: faker.finance.ethereumAddress(),
            address: faker.finance.ethereumAddress(),
            tierId: 0,
            tokenAddress: faker.finance.ethereumAddress(),
            tokenId: faker.random.numeric(3),
            price: faker.random.numeric(19),
            paymentToken: faker.finance.ethereumAddress(),
        });

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('MintSaleTransaction', () => {
        it('should return transaction', async () => {
            const query = gql`
                query GetTransaction($id: String!) {
                    transaction(id: $id) {
                        id
                    }
                }
            `;

            const variables = {
                id: transaction.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.transaction.id).toEqual(transaction.id);
                });
        });
    });

    describe('Leaderboard', () => {
        it('should be return leaderboard', async () => {
            const contractAddress = faker.finance.ethereumAddress();
            const recipient1 = faker.finance.ethereumAddress();
            const recipient2 = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();

            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: contractAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: paymentToken,
            });
            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: contractAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: paymentToken,
            });
            await service.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient2,
                address: contractAddress,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: paymentToken,
            });

            const query = gql`
                query Leaderboard($address: String!) {
                    leaderboard(address: $address) {
                        rank
                        amount
                        item
                        address
                        paymentToken
                    }
                }
            `;
            const variables = {
                address: contractAddress,
            };
            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.leaderboard).toBeDefined();
                    expect(body.data.leaderboard[0].rank).toBeDefined();
                    expect(body.data.leaderboard[0].rank).toBe(1);
                    expect(body.data.leaderboard[1].rank).toBeDefined();
                    expect(body.data.leaderboard[1].rank).toBe(2);
                });
        });
    });
});
