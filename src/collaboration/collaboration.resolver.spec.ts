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
                    host: postgresConfig.host,
                    port: postgresConfig.port,
                    username: postgresConfig.username,
                    password: postgresConfig.password,
                    database: postgresConfig.database,
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
                    }
                }
            `;

            const variables = {
                input: {
                    walletId: wallet.id,
                    collectionId: collection.id,
                    royaltyRate: 9,
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
            const query = gql`
                query Collaboration($id: String!) {
                    collaboration(id: $id) {
                        id
                        royaltyRate
                    }
                }
            `;

            const variables = {
                id: collaboration.id,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collaboration.id).toEqual(variables.id);
                });
        });
    });
});
