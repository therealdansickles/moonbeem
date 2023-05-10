import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { SearchModule } from '../src/search/search.module';
import { CollectionService } from '../src/collection/collection.service';
import { WalletService } from '../src/wallet/wallet.service';
import { PrismaService } from '../src/prisma/prisma.service';

import * as request from 'supertest';

export const gql = String.raw;

const param = {
    executeSearch: gql`
        query {
            globalSearch(searchTerm: "c", page: 0, pageSize: 3) {
                collections {
                    data {
                        name
                        chainId
                    }
                }
                accounts {
                    data {
                        name
                        address
                    }
                }
            }
        }
    `,
};

describe('Search Resolver (e2e) {Supertest}', () => {
    let collectionService: CollectionService;
    let walletService: WalletService;
    let app: INestApplication;
    let collectionId: string;

    beforeAll(async () => {
        jest.setTimeout(70000);
        const moduleFixture: TestingModule = await Test.createTestingModule({
            providers: [CollectionService, WalletService, PrismaService],
            imports: [
                SearchModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: 'schema.graphql',
                }),
            ],
        }).compile();

        collectionService = moduleFixture.get<CollectionService>(CollectionService);
        walletService = moduleFixture.get<WalletService>(WalletService);

        app = moduleFixture.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        if (collectionId) {
            await collectionService.deleteCollection(collectionId);
        }
        await app.close();
    });

    describe('/graphql', () => {
        describe('executeSearch', () => {
            it('should return search results', async () => {
                const creator = await walletService.createWallet(faker.finance.ethereumAddress());

                const collection = await collectionService.createCollection({
                    name: faker.company.name(),
                    displayName: 'The best collection',
                    address: faker.finance.ethereumAddress(),
                    chainId: 1,
                    kind: 'tiered',
                    about: 'The best collection ever',
                    avatarUrl: 'http://www.google.com/1.png',
                    backgroundUrl: 'http://www.google.com/1.png',
                    websiteUrl: 'http://www.google.com',
                    twitter: 'testcollection',
                    instagram: 'testthots',
                    discord: 'testcollection#123',
                    tags: ['test', 'collection'],
                    creator: { id: creator.id },
                });

                collectionId = collection.id;

                return request(app.getHttpServer())
                    .post('/graphql')
                    .send({ query: param.executeSearch })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.data.globalSearch).toBeDefined();
                        expect(res.body.data.globalSearch.collections).toBeDefined();
                        expect(res.body.data.globalSearch.accounts).toBeDefined();
                        expect(res.body.data.globalSearch.collections.data.length).toBeLessThanOrEqual(3);
                        expect(res.body.data.globalSearch.collections.data[0].chainId).toBeDefined();
                    });
            });
        });
    });
});
