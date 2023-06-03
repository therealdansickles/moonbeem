import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinService } from '../sync-chain/coin/coin.service';
import { Collection } from './collection.entity';
import { CollectionModule } from './collection.module';
import { CollectionService } from './collection.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { OrganizationService } from '../organization/organization.service';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletService } from '../wallet/wallet.service';
import { CollaborationService } from '../collaboration/collaboration.service';

describe('CollectionService', () => {
    let repository: Repository<Collection>;
    let service: CollectionService;
    let coin: Coin;
    let coinService: CoinService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let organizationService: OrganizationService;
    let tierService: TierService;
    let userService: UserService;
    let walletService: WalletService;
    let collaborationService: CollaborationService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                CollectionModule,
            ],
        }).compile();

        repository = module.get('CollectionRepository');
        service = module.get<CollectionService>(CollectionService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        mintSaleTransactionService = module.get<MintSaleTransactionService>(MintSaleTransactionService);
        userService = module.get<UserService>(UserService);
        tierService = module.get<TierService>(TierService);
        coinService = module.get<CoinService>(CoinService);
        walletService = module.get<WalletService>(WalletService);
        collaborationService = module.get<CollaborationService>(CollaborationService);

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
        global.gc && global.gc();
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

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const result = await service.getCollection(collection.id);
            expect(result.id).not.toBeNull();
            expect(result.organization.name).not.toBeNull();
            expect(result.creator.id).toEqual(wallet.id);
        });

        it('should get a collection by id with tiers and collabs', async () => {
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

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const newCollab = await collaborationService.createCollaboration({
                walletId: wallet.id,
                royaltyRate: 12,
                userId: owner.id,
                organizationId: organization.id,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const collection = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: { id: organization.id },
                collaboration: { id: newCollab.id },
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
                        tierId: 0,
                        price: '200',
                    },
                ],
            });

            const result = await service.getCollection(collection.id);

            expect(result.id).not.toBeNull();
            expect(result.organization.name).not.toBeNull();
            expect(result.tiers).not.toBeNull();
            expect(result.tiers.some((tier) => tier.totalMints === 200)).toBeTruthy();
            expect(result.tiers.some((tier) => tier.price === '200')).toBeTruthy();
            expect(result.collaboration).not.toBeNull();
            expect(result.collaboration.id).toBe(newCollab.id);
        });
    });

    describe('getCollectionByQuery', () => {
        it('should return null if no parameter provided', async () => {
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
            const result = await service.getCollectionByQuery({});
            expect(result).toBeNull();
        });

        it('should get collections by id', async () => {
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
            const result = await service.getCollectionByQuery({ id: collection.id });
            expect(result.id).toEqual(collection.id);
            expect(result.address).toEqual(collection.address);
            expect(result.organization.name).not.toBeNull();
        });

        it('should get collections by address', async () => {
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
            const result = await service.getCollectionByQuery({ address: collection.address });
            expect(result.id).toEqual(collection.id);
            expect(result.address).toEqual(collection.address);
            expect(result.organization.name).not.toBeNull();
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
                tierId: 0,
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const result = await service.getCollectionsByOrganizationId(organization.id);
            expect(result[0].id).not.toBeNull();
            expect(result[0].organization.name).not.toBeNull();
            expect(result[0].tiers).not.toBeNull();
            expect(result[0].tiers.some((tier) => tier.totalMints === 200)).toBeTruthy();
        });
    });

    describe('getCreatedCollectionsByWalletId', () => {
        it('should get collections by wallet', async () => {
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

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [],
                organization: {
                    id: organization.id,
                },
                creator: { id: wallet.id },
            });

            const [result, ..._rest] = await service.getCreatedCollectionsByWalletId(wallet.id);

            expect(result).toBeDefined();
            expect(result.creator.id).toEqual(wallet.id);
            expect(result.organization.id).toEqual(organization.id);
        });
    });

    describe('createCollection', () => {
        it('should create a collection', async () => {
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

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: parseInt(faker.random.numeric(5)),
                    },
                ],
                organization: {
                    id: organization.id,
                },
                creator: { id: wallet.id },
            });

            expect(collection).toBeDefined();
            expect(collection.displayName).toEqual('The best collection');
            expect(collection.organization.id).toEqual(organization.id);
            expect(collection.creator.id).toEqual(wallet.id);
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

        it('should update a collaboration in a collection', async () => {
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

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                address: faker.finance.ethereumAddress(),
                tags: [],
            });

            const newCollab = await collaborationService.createCollaboration({
                walletId: wallet.id,
                royaltyRate: 12,
                userId: owner.id,
                organizationId: organization.id,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const result = await service.updateCollection(collection.id, {
                displayName: 'The best collection ever',
                collaboration: { id: newCollab.id },
            });

            expect(result).toBeTruthy();

            const updatedCollection = await service.getCollection(collection.id);

            expect(updatedCollection.collaboration.id).toEqual(newCollab.id);
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

        it('should delete a collection with tiers', async () => {
            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                address: faker.finance.ethereumAddress(),
                tags: [],
                publishedAt: null,
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            await tierService.createTier({
                name: faker.company.name(),
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
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

    describe('getBuyers', () => {
        it('should get buyers(wallet)', async () => {
            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                publishedAt: new Date(),
            });

            const txn = await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const [result, ...rest] = await service.getBuyers(collection.address);
            expect(result).toEqual(txn.recipient);
        });
    });

    describe('getCollectionByQuery', () => {
        it('should return tier info and the coin info contained in the tier', async () => {
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

            const collection = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: { id: organization.id },
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
                        tierId: 0,
                        price: '200',
                    },
                ],
            });

            const result = await service.getCollectionByQuery({ id: collection.id });
            expect(result.id).toEqual(collection.id);
            expect(result.address).toEqual(collection.address);
            expect(result.organization.name).not.toBeNull();
            expect(result.tiers).not.toBeNull();
            expect(result.tiers[0].coin).not.toBeNull();
            expect(result.tiers[0].coin.address).toEqual(coin.address);
        });
    });

    describe('getCollectionStat', () => {
        let collection: Collection;

        beforeEach(async () => {
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

            collection = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: { id: organization.id },
                nameOnOpensea: faker.finance.accountName(),
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
                        tierId: 0,
                        price: '200',
                    },
                ],
            });
        })

        afterEach(async () => {
            await repository.query('TRUNCATE TABLE "User" CASCADE;')
            await repository.query('TRUNCATE TABLE "Organization" CASCADE;')
            await repository.query('TRUNCATE TABLE "Collection" CASCADE;')
        });

        it('should return the right response from opensea', async () => {
            const mockResponse = [{
                source: 'opensea',
                data: {
                    supply: faker.datatype.float(),
                    floorPrice: faker.datatype.float(),
                    volume: {
                        hourly: faker.datatype.float(),
                        daily: faker.datatype.float(),
                        weekly: faker.datatype.float(),
                        total: faker.datatype.float(),
                    },
                    sales: {
                        hourly: faker.datatype.float(),
                        daily: faker.datatype.float(),
                        weekly: faker.datatype.float(),
                        total: faker.datatype.float(),
                    },
                }
            }];
            jest.spyOn(service, 'getSecondartMarketStat').mockImplementation(async () => mockResponse);
            const result = await service.getSecondartMarketStat({ address: collection.address });
            expect(result.length).toEqual(1);
            expect(result[0].source).toEqual('opensea');
        })
    })
});
