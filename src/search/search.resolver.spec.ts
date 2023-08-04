import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { CollectionService } from '../collection/collection.service';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';

export const gql = String.raw;

describe('SearchResolver', () => {
    let walletService: WalletService;
    let collectionService: CollectionService;
    let app: INestApplication;
    let userService: UserService;
    let organizationService: OrganizationService;

    beforeAll(async () => {
        app = global.app;
        userService = global.userService;
        walletService = global.walletService;
        collectionService = global.collectionService;
        organizationService = global.organizationService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('search bar', () => {
        it('should search all', async () => {
            const name = faker.company.name();
            // create user
            const user = await userService.createUser({
                name,
                email: faker.internet.email(),
                password: 'password',
            });
            await userService.createUser({
                name: faker.company.name(),
                email: faker.internet.email(),
                password: 'password',
            });

            // create collection
            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: user,
            });

            const collectionAddress = faker.finance.ethereumAddress();
            await collectionService.createCollectionWithTiers({
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
                        metadata: {
                            uses: [],
                            properties: {
                                level: {
                                    name: 'level',
                                    type: 'string',
                                    value: 'basic',
                                    display_value: 'Basic',
                                },
                                holding_days: {
                                    name: 'holding_days',
                                    type: 'integer',
                                    value: 125,
                                    display_value: 'Days of holding',
                                },
                            },
                        },
                    },
                ],
                organization: organization,
            });

            // create wallet
            await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                name: `first wallet of ${name}`,
                ownerId: user.id,
            });
            await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                name: `second wallet of ${name}`,
                ownerId: user.id,
            });
            await walletService.createWallet({
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
