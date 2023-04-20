import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
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

        wallet = await walletService.createWallet(`arb:${faker.finance.ethereumAddress()}`);
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
            });
            collaboration = result;
            expect(result.royaltyRate).toEqual(12);
            expect(result.wallet).toEqual(wallet.id);
            expect(result.collection).toEqual(collection.id);
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
    });
});
