import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { MintSaleTransaction } from './mint-sale-transaction.entity';
import { MintSaleTransactionModule } from './mint-sale-transaction.module';
import { MintSaleTransactionService } from './mint-sale-transaction.service';

export const gql = String.raw;

describe.only('MintSaleTransactionResolver', () => {
    let repository: Repository<MintSaleTransaction>;
    let service: MintSaleTransactionService;
    let app: INestApplication;
    let transaction: MintSaleTransaction;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                MintSaleTransactionModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [MintSaleTransactionModule],
                }),
            ],
        }).compile();

        repository = module.get('sync_chain_MintSaleTransactionRepository');
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
        await repository.query('TRUNCATE TABLE "MintSaleTransaction" CASCADE');
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
});
