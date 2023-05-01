import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { GraphQLError } from 'graphql';
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

describe('CollaborationService', () => {
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
            ],
        }).compile();

        repository = module.get('CollaborationRepository');
        service = module.get<CollaborationService>(CollaborationService);
        collectionService = module.get<CollectionService>(CollectionService);
        walletService = module.get<WalletService>(WalletService);

        collection = await collectionService.createCollection({
            name: faker.company.name(),
            displayName: 'The best collection',
            about: 'The best collection ever',
            chainId: 1,
            address: faker.finance.ethereumAddress(),
            artists: [],
            tags: [],
        });

        wallet = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Collaboration" CASCADE');
        await repository.query('TRUNCATE TABLE "Wallet" CASCADE');
        await repository.query('TRUNCATE TABLE "Collection" CASCADE');
    });

    describe('createCollaboration', () => {
        it('should create a collaboration', async () => {
            const result = await service.createCollaboration({
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
            collaboration = result;
            expect(result.royaltyRate).toEqual(12);
            expect(result.wallet).toEqual(wallet.id);
            expect(result.collection).toEqual(collection.id);
        });

        it('should throw error if wallet-collection pair is already existed', async () => {
            const freshNewWallet = await walletService.createWallet({
                address: `eth:${faker.finance.ethereumAddress()}`,
            });
            const freshNewCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.finance.accountName(),
                chainId: 1,
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });
            const collaboration1 = await service.createCollaboration({
                walletId: freshNewWallet.id,
                collectionId: freshNewCollection.id,
                royaltyRate: 98,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            expect(
                (async function () {
                    await service.createCollaboration({
                        walletId: freshNewWallet.id,
                        collectionId: freshNewCollection.id,
                        royaltyRate: 1,
                    });
                })()
            ).rejects.toThrowError(GraphQLError);
        });

        it('should throw error if royalty out of bound', async () => {
            const newCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.finance.accountName(),
                chainId: 1,
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });
            const wallet1 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            const collaboration1 = await service.createCollaboration({
                walletId: wallet1.id,
                collectionId: newCollection.id,
                royaltyRate: 98,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            const wallet2 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            const collaboration2 = await service.createCollaboration({
                walletId: wallet2.id,
                collectionId: newCollection.id,
                royaltyRate: 2,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            const anotherCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.finance.accountName(),
                chainId: 1,
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });
            // this should work as it's another collection
            const collaborationForAnotherCollection = await service.createCollaboration({
                walletId: wallet1.id,
                collectionId: anotherCollection.id,
                royaltyRate: 1,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            expect(collaborationForAnotherCollection.wallet).toEqual(wallet1.id);
            expect(collaborationForAnotherCollection.collection).toEqual(anotherCollection.id);
            // would fail
            const wallet3 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            expect(
                (async function () {
                    await service.createCollaboration({
                        walletId: wallet3.id,
                        collectionId: newCollection.id,
                        royaltyRate: 1,
                        collaborators: [
                            {
                                address: faker.finance.ethereumAddress(),
                                role: faker.finance.accountName(),
                                name: faker.finance.accountName(),
                                rate: parseInt(faker.random.numeric(2)),
                            },
                        ],
                    });
                })()
            ).rejects.toThrowError(GraphQLError);
        });
    });

    describe('getCollaboration', () => {
        it('should return a collaboration', async () => {
            const result = await service.getCollaboration(collaboration.id);
            expect(result).toBeDefined();
            expect(result.royaltyRate).toEqual(12);
        });

        it('should not return a collaboration if id is wrong', async () => {
            const result = await service.getCollaboration(faker.datatype.uuid());
            expect(result).toBeNull();
        });

        it('should return a collaboration with its wallet and collection', async () => {
            const result = await service.getCollaboration(collaboration.id);
            expect(result.wallet).toBeDefined();
            expect(result.collection).toBeDefined();
        });
    });
});
