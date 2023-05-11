import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';
import { CollectionService } from '../collection/collection.service';
import { SearchModule } from './search.module';
import { CollectionModule } from '../collection/collection.module';
import { WalletService } from '../wallet/wallet.service';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';

export const gql = String.raw;

describe('SearchResolver', () => {
    let walletService: WalletService;
    let authService: AuthService;
    let collectionService: CollectionService;
    let app: INestApplication;

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
                AuthModule,
                CollectionModule,
                WalletModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [SearchModule, WalletModule, AuthModule],
                }),
            ],
        }).compile();

        walletService = module.get<WalletService>(WalletService);
        authService = module.get<AuthService>(AuthService);
        collectionService = module.get<CollectionService>(CollectionService);
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('globalSearchV1', () => {
        it('should perform search for collection', async () => {
            const name = faker.company.name();
            await collectionService.createCollection({
                name,
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });

            const query = gql`
                query search($input: GloablSearchInput!) {
                    globalSearchV1(input: $input) {
                        users {
                            data {
                                name
                                avatar
                            }
                        }
                        collections {
                            data {
                                name
                                image
                            }
                            total
                            isLastPage
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    searchTerm: name.toUpperCase(),
                    page: 0,
                    pageSize: 3,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.globalSearchV1.collections.data.length).toEqual(1);
                    expect(body.data.globalSearchV1.collections.data[0].name).toEqual(name);
                    expect(body.data.globalSearchV1.collections.isLastPage).toBeTruthy();
                });
        });

        it('should perform search for user', async () => {
            const name = faker.company.name();
            const user = await authService.createUserWithEmail({
                name,
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: user.user.id,
            });

            const query = gql`
                query search($input: GloablSearchInput!) {
                    globalSearchV1(input: $input) {
                        users {
                            data {
                                name
                                avatar
                                address
                            }
                            total
                            isLastPage
                        }
                        collections {
                            data {
                                name
                                image
                            }
                            total
                            isLastPage
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    searchTerm: wallet.address,
                    page: 0,
                    pageSize: 3,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.globalSearchV1.users.data.length).toEqual(1);
                    expect(body.data.globalSearchV1.users.data[0].name).toEqual(name);
                    expect(body.data.globalSearchV1.users.data[0].address).toEqual(wallet.address);
                    expect(body.data.globalSearchV1.users.isLastPage).toBeTruthy();
                });
        });
    });
});
