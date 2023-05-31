import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { CollectionService } from '../collection/collection.service';
import { SearchModule } from './search.module';
import { CollectionModule } from '../collection/collection.module';
import { WalletService } from '../wallet/wallet.service';
import { WalletModule } from '../wallet/wallet.module';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';

export const gql = String.raw;

describe('SearchResolver', () => {
    let walletService: WalletService;
    let collectionService: CollectionService;
    let app: INestApplication;
    let userService: UserService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
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
                SearchModule,
                CollectionModule,
                WalletModule,
                UserModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [SearchModule, WalletModule],
                }),
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        walletService = module.get<WalletService>(WalletService);
        collectionService = module.get<CollectionService>(CollectionService);
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('search bar', () => {
        it('should search all', async () => {
            const name = faker.company.name();
            // create user
            const user = await userService.createUser({
                name,
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            await userService.createUser({
                name: faker.company.name(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            // create collection
            const collection = await collectionService.createCollection({
                name: `${name}'s collection`,
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });

            // create wallet
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                name: `first wallet of ${name}`,
                ownerId: user.id,
            });
            const wallet2 = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                name: `second wallet of ${name}`,
                ownerId: user.id,
            });
            const wallet3 = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                name: `third wallet of ${name}`,
                ownerId: user.id,
            });

            const query = gql`
                query search($input: SearchInput!) {
                    search {
                        user(input: $input) {
                            users {
                                name
                            }
                            total
                        }
                        collection(input: $input) {
                            collections {
                                name
                            }
                            total
                        }
                        wallet(input: $input) {
                            wallets {
                                name
                            }
                            total
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    keyword: name,
                    offset: 0,
                    limit: 2,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.search.user.total).toEqual(1);
                    expect(body.data.search.user.users).toBeDefined();
                    expect(body.data.search.user.users[0].name).toEqual(name);

                    expect(body.data.search.collection.total).toEqual(1);
                    expect(body.data.search.collection.collections).toBeDefined();
                    expect(body.data.search.collection.collections[0].name).toEqual(`${name}'s collection`);

                    expect(body.data.search.wallet.total).toEqual(3);
                    expect(body.data.search.wallet.wallets).toBeDefined();
                    expect(body.data.search.wallet.wallets.length).toEqual(2);
                });
        });
    });
});
