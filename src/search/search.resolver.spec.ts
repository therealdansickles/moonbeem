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
import { OrganizationService } from '../organization/organization.service';

export const gql = String.raw;

describe('SearchResolver', () => {
    let walletService: WalletService;
    let collectionService: CollectionService;
    let app: INestApplication;
    let userService: UserService;
    let organizationService: OrganizationService;

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
                    url: postgresConfig.syncChain.url,
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
        organizationService = module.get<OrganizationService>(OrganizationService);
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
            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: user,
            });

            const collectionAddress = faker.finance.ethereumAddress();
            const collection = await collectionService.createCollectionWithTiers({
                name: `${name}'s collection`,
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: collectionAddress,
                tags: [],
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: faker.finance.ethereumAddress(),
                        tierId: 0,
                        price: '200',
                    },
                ],
                organization: organization,
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

            const queryCollection = gql`
                query search($input: SearchInput!) {
                    search {
                        collection(input: $input) {
                            collections {
                                address
                                totalSupply
                            }
                            total
                        }
                    }
                }
            `;
            const variablesForQueryCollection = { input: { keyword: collectionAddress } };
            await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: queryCollection, variables: variablesForQueryCollection })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.search.collection.total).toEqual(1);
                    expect(body.data.search.collection.collections).toBeDefined();
                    expect(body.data.search.collection.collections[0].address).toEqual(collectionAddress.toLowerCase());
                    expect(body.data.search.collection.collections[0].totalSupply).toEqual(200);
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
                                totalSupply
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
                    expect(body.data.search.collection.collections[0].totalSupply).toEqual(200);

                    expect(body.data.search.wallet.total).toEqual(3);
                    expect(body.data.search.wallet.wallets).toBeDefined();
                    expect(body.data.search.wallet.wallets.length).toEqual(2);
                });
        });
    });
});
