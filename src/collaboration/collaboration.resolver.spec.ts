import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { Collaboration } from './collaboration.entity';
import { CollaborationModule } from './collaboration.module';
import { CollaborationService } from './collaboration.service';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { WalletService } from '../wallet/wallet.service';

export const gql = String.raw;

describe('CollaborationResolver', () => {
    let app: INestApplication;
    let repository: Repository<Collaboration>;
    let service: CollaborationService;
    let collaboration: Collaboration;
    let collection: Collection;
    let collectionService: CollectionService;
    let wallet: Wallet;
    let walletService: WalletService;

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
                CollaborationModule,
                CollectionModule,
                WalletModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [CollaborationModule, CollectionModule, WalletModule],
                }),
            ],
        }).compile();

        repository = module.get('CollaborationRepository');
        service = module.get<CollaborationService>(CollaborationService);
        walletService = module.get<WalletService>(WalletService);
        collectionService = module.get<CollectionService>(CollectionService);

        wallet = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });

        collection = await collectionService.createCollection({
            name: faker.company.name(),
            displayName: 'The best collection',
            about: 'The best collection ever',
            address: faker.finance.ethereumAddress(),
            artists: [],
            tags: [],
        });

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Wallet" CASCADE');
        await repository.query('TRUNCATE TABLE "Collection" CASCADE');
        await repository.query('TRUNCATE TABLE "Collaboration" CASCADE');
        await app.close();
    });

    describe('createCollaboration', () => {
        it('should create a collaboration', async () => {
            const query = gql`
                mutation CreateCollaboration($input: CreateCollaborationInput!) {
                    createCollaboration(input: $input) {
                        id
                        royaltyRate
                        collaborators {
                            name
                            role
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    walletId: wallet.id,
                    collectionId: collection.id,
                    royaltyRate: 9,
                    collaborators: [
                        {
                            address: faker.finance.ethereumAddress(),
                            role: faker.finance.accountName(),
                            name: faker.finance.accountName(),
                            rate: parseInt(faker.random.numeric(2)),
                        },
                    ],
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createCollaboration.royaltyRate).toEqual(variables.input.royaltyRate);
                    collaboration = body.data.createCollaboration;
                });
        });
    });

    describe('getCollaboration', () => {
        it('should get a collaboration if we had right id', async () => {
            wallet = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            collaboration = await service.createCollaboration({
                walletId: wallet.id,
                collectionId: collection.id,
                royaltyRate: 12,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const query = gql`
                query Collaboration($id: String!) {
                    collaboration(id: $id) {
                        id
                        royaltyRate

                        wallet {
                            address
                        }

                        collection {
                            name
                        }
                    }
                }
            `;

            const variables = {
                id: collaboration.id,
            };

            // FIXME: This is flakey sometimes. Unique index contraint issues?
            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collaboration.id).toEqual(variables.id);
                    expect(body.data.collaboration.wallet.address).not.toBeNull();
                    expect(body.data.collaboration.collection.name).not.toBeNull();
                });
        });
    });
});
