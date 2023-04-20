import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

import { Tier } from './tier.entity';
import { TierModule } from './tier.module';
import { TierService } from './tier.service';
import { Collection, CollectionKind } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';

describe('TierService', () => {
    let repository: Repository<Tier>;
    let service: TierService;
    let tier: Tier;
    let collection: Collection;
    let collectionService: CollectionService;

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
                CollectionModule,
                TierModule,
            ],
        }).compile();


        repository = module.get('TierRepository');
        service = module.get<TierService>(TierService);
        collectionService = module.get<CollectionService>(CollectionService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Tier" CASCADE');
        await repository.query('TRUNCATE TABLE "Collection" CASCADE');
    });

    describe('createTier', () => {
        it('should create a new tier', async () => {
            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collectionId: collection.id,
            });

            expect(tier).toBeDefined();
        });
    });

    describe('updateTier', () => {
        it('should update a tier', async () => {
            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collectionId: collection.id,
            });

            let result = await service.updateTier(tier.id, {
                name: 'New name',
            });

            expect(result).toBeTruthy();
        });
    });

    describe('deleteTier', () => {
        it('should delete a tier', async () => {
            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collectionId: collection.id,
            });

            let result = await service.deleteTier(tier.id);

            expect(result).toBeTruthy();
        });
    });
});
