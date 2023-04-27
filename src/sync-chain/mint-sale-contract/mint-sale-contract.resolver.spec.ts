import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { INestApplication } from '@nestjs/common';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { MintSaleContract } from './mint-sale-contract.entity';
import { MintSaleContractModule } from './mint-sale-contract.module';
import { MintSaleContractService } from './mint-sale-contract.service';

export const gql = String.raw;

describe.only('MintSaleContractResolver', () => {
    let repository: Repository<MintSaleContract>;
    let service: MintSaleContractService;
    let app: INestApplication;
    let contract: MintSaleContract;

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
                MintSaleContractModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [MintSaleContractModule],
                }),
            ],
        }).compile();

        repository = module.get('sync_chain_MintSaleContractRepository');
        service = module.get<MintSaleContractService>(MintSaleContractService);
        app = module.createNestApplication();

        contract = await service.createMintSaleContract({
            height: parseInt(faker.random.numeric(5)),
            txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
            txTime: Math.floor(faker.date.recent().getTime() / 1000),
            sender: faker.finance.ethereumAddress(),
            address: faker.finance.ethereumAddress(),
            royaltyReceiver: faker.finance.ethereumAddress(),
            royaltyRate: 10000,
            derivativeRoyaltyRate: 1000,
            isDerivativeAllowed: true,
            beginTime: Math.floor(faker.date.recent().getTime() / 1000),
            endTime: Math.floor(faker.date.recent().getTime() / 1000),
            tierId: 0,
            price: faker.random.numeric(19),
            paymentToken: faker.finance.ethereumAddress(),
            startId: 1,
            endId: 100,
            currentId: 1,
            tokenAddress: faker.finance.ethereumAddress(),
        });

        await app.init();
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "MintSaleContract" CASCADE');
        await app.close();
    });

    describe('MintSaleContract', () => {
        it('should return an contract', async () => {
            const query = gql`
                query GetMintSaleContract($id: String!) {
                    mintSaleContract(id: $id) {
                        id
                        chainId
                    }
                }
            `;

            const variables = {
                id: contract.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.mintSaleContract.id).toEqual(contract.id);
                });
        });
    });
});
