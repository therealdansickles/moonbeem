import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { Collection } from './collection.entity';
import { CollectionService } from './collection.service';
import { CollectionModule } from './collection.module';
import { Organization } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { TierService } from '../tier/tier.service';
import { TierModule } from '../tier/tier.module';
import { CoinService } from '../sync-chain/coin/coin.service';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { Coin } from '../sync-chain/coin/coin.entity';

describe('CollectionService', () => {
    let repository: Repository<Collection>;
    let service: CollectionService;
    let organizationService: OrganizationService;
    let userService: UserService;
    let tierService: TierService;
    let coinService: CoinService;
    let coin: Coin;

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
                CoinModule,
                CollectionModule,
            ],
        }).compile();

        repository = module.get('CollectionRepository');
        service = module.get<CollectionService>(CollectionService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        userService = module.get<UserService>(UserService);
        tierService = module.get<TierService>(TierService);
        coinService = module.get<CoinService>(CoinService);

        coin = await coinService.createCoin({
            address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
            name: 'Wrapped Ether',
            symbol: 'WETH',
            decimals: 18,
            derivedETH: 1,
            derivedUSDC: 1,
            enabled: true,
            chainId: 1,
        });
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Collection" CASCADE');
    });

    describe('getCollection', () => {
        it('should get a collection by id', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

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
                owner: owner,
            });

            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });
            const result = await service.getCollection(collection.id);
            expect(result.id).not.toBeNull();
            expect(result.organization.name).not.toBeNull();
        });

        it('should get a collection by id with tiers', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

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
                owner: owner,
            });

            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });

            const result = await service.getCollection(collection.id);
            expect(result.id).not.toBeNull();
            expect(result.organization.name).not.toBeNull();
            expect(result.tiers).not.toBeNull();
            expect(result.tiers.some((tier) => tier.totalMints === 200)).toBeTruthy();
        });
    });

    describe('getCollectionByAddress', () => {
        it('should get collections by organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

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
                owner: owner,
            });

            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });
            const result = await service.getCollectionByAddress(collection.address);
            expect(result.id).not.toBeNull();
            expect(result.organization.name).not.toBeNull();
        });
    });

    describe('getCollectionsByOrganizationId', () => {
        it('should get collections by organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

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
                owner: owner,
            });

            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });
            const result = await service.getCollectionsByOrganizationId(organization.id);
            expect(result[0].id).not.toBeNull();
            expect(result[0].organization.name).not.toBeNull();
        });

        it('should get collections by organization with tiers', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

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
                owner: owner,
            });

            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });

            const result = await service.getCollectionsByOrganizationId(organization.id);
            expect(result[0].id).not.toBeNull();
            expect(result[0].organization.name).not.toBeNull();
            expect(result[0].tiers).not.toBeNull();
            expect(result[0].tiers.some((tier) => tier.totalMints === 200)).toBeTruthy();
        });
    });

    describe('createCollection', () => {
        it('should create a collection', async () => {
            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });

            expect(collection).toBeDefined();
            expect(collection.displayName).toEqual('The best collection');
        });
    });

    describe('updateCollection', () => {
        it('should update a collection', async () => {
            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                address: faker.finance.ethereumAddress(),
                tags: [],
            });

            const result = await service.updateCollection(collection.id, {
                displayName: 'The best collection ever',
            });

            expect(result).toBeTruthy();
        });
    });

    describe('publishCollection', () => {
        it('should publish a collection', async () => {
            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                address: faker.finance.ethereumAddress(),
                about: 'The best collection ever',
                artists: [],
                tags: [],
            });

            const result = await service.publishCollection(collection.id);

            expect(result).toBeTruthy();
        });
    });

    describe('deleteCollection', () => {
        it('should delete a collection', async () => {
            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                address: faker.finance.ethereumAddress(),
                tags: [],
                publishedAt: null,
            });

            const result = await service.deleteCollection(collection.id);
            expect(result).toBeTruthy();
        });

        it('should not delete a published collection', async () => {
            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                publishedAt: new Date(),
            });

            const result = await service.deleteCollection(collection.id);
            expect(result).toBeFalsy();
        });
    });
});
