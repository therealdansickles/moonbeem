import { addDays, startOfDay, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { ethers } from 'ethers';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { CollaborationService } from '../collaboration/collaboration.service';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { MerkleTreeService } from '../merkleTree/merkleTree.service';
import { NftService } from '../nft/nft.service';
import { OrganizationService } from '../organization/organization.service';
import { Plugin } from '../plugin/plugin.entity';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { CoinQuotes } from '../sync-chain/coin/coin.dto';
import { CoinService } from '../sync-chain/coin/coin.service';
import { History721Type } from '../sync-chain/history721/history721.entity';
import { History721Service } from '../sync-chain/history721/history721.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import {
    createAsset721,
    createCoin,
    createCollection,
    createCollection2,
    createHistory721,
    createMintSaleContract,
    createMintSaleTransaction,
    createOrganization,
    createPlugin,
    createRecipientsMerkleTree,
    createTier,
} from '../test-utils';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { CollectionActivityType, CollectionStat, CollectionStatus } from './collection.dto';
import { Collection, CollectionKind } from './collection.entity';
import { CollectionService } from './collection.service';
import { NftContract } from 'alchemy-sdk';
import { AlchemyService } from '../alchemy/alchemy.service';

describe('CollectionService', () => {
    let repository: Repository<Collection>;
    let pluginRepository: Repository<Plugin>;
    let service: CollectionService;
    let coinService: CoinService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let mintSaleContractService: MintSaleContractService;
    let asset721Service: Asset721Service;
    let history721Service: History721Service;
    let organizationService: OrganizationService;
    let tierService: TierService;
    let userService: UserService;
    let walletService: WalletService;
    let collaborationService: CollaborationService;
    let nftService: NftService;
    let merkleTreeService: MerkleTreeService;
    let collectionPluginService: CollectionPluginService;
    let alchemyService: AlchemyService;

    beforeAll(async () => {
        repository = global.collectionRepository;
        pluginRepository = global.pluginRepository;
        service = global.collectionService;
        organizationService = global.organizationService;
        collaborationService = global.collaborationService;
        userService = global.userService;
        tierService = global.tierService;
        coinService = global.coinService;
        mintSaleTransactionService = global.mintSaleTransactionService;
        mintSaleContractService = global.mintSaleContractService;
        asset721Service = global.asset721Service;
        walletService = global.walletService;
        history721Service = global.history721Service;
        nftService = global.nftService;
        merkleTreeService = global.merkleTreeService;
        collectionPluginService = global.collectionPluginService;
        alchemyService = global.alchemyService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        (await global.gc) && (await global.gc());
    });

    describe('getCollection', () => {
        it('should get a collection by id', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await createCollection(service, {
                organization,
                creator: { id: wallet.id },
            });

            const result = await service.getCollection(collection.id);
            expect(result.id).not.toBeNull();
            expect(result.organization.name).not.toBeNull();
            expect(result.creator.id).toEqual(wallet.id);
        });

        it('should get a collection by id with tiers and collabs', async () => {
            const coin = await createCoin(coinService);

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
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
                password: 'password',
            });

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
                owner: owner,
            });

            await repository.save({
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
                password: 'password',
            });

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
                password: 'password',
            });

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

        it('should get collections by name', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
            const result = await service.getCollectionByQuery({ name: collection.name });
            expect(result.id).toEqual(collection.id);
            expect(result.name).toEqual(collection.name);
            expect(result.organization.name).not.toBeNull();
        });

        it('should get collections by slug', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, {
                owner: owner,
            });

            const collection = await createCollection(service, {
                organization: organization,
            });
            const result = await service.getCollectionByQuery({ slug: collection.slug });
            expect(result.id).toEqual(collection.id);
            expect(result.name).toEqual(collection.name);
            expect(result.slug).toEqual(collection.slug);
        });

        it('should get nothing by an invalid name', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            const collection = await repository.save({
                name: `${faker.company.name()}${faker.string.numeric({ length: 5, allowLeadingZeros: false })}`,
                displayName: faker.company.name(),
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });
            const result = await service.getCollectionByQuery({ name: `${collection.name}+1` });
            expect(result).toBeNull();
        });
    });

    describe('countCollections', () => {
        it('should get total count for given publishedAt parameter', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            await repository.save({
                name: `${faker.company.name()}${faker.string.numeric({ length: 5, allowLeadingZeros: false })}`,
                displayName: faker.company.name(),
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                publishedAt: faker.date.past(),
            });

            await repository.save({
                name: `${faker.company.name()}${faker.string.numeric({ length: 5, allowLeadingZeros: false })}`,
                displayName: faker.company.name(),
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                publishedAt: faker.date.future(),
            });

            const result = await service.countCollections({ publishedAt: MoreThanOrEqual(new Date()) });
            expect(result).toEqual(1);
        });

        it('should get total count for organizationId & beginSaleAt & endSaleAt', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            const anotherOrganization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            await repository.save({
                name: `${faker.company.name()}${faker.string.numeric({ length: 5, allowLeadingZeros: false })}`,
                displayName: faker.company.name(),
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                beginSaleAt: Math.floor(faker.date.past().getTime() / 1000),
                endSaleAt: Math.floor(faker.date.future().getTime() / 1000),
            });

            // don't belongs to this
            await repository.save({
                name: `${faker.company.name()}${faker.string.numeric({ length: 5, allowLeadingZeros: false })}`,
                displayName: faker.company.name(),
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: anotherOrganization,
                beginSaleAt: Math.floor(faker.date.past().getTime() / 1000),
                endSaleAt: Math.floor(faker.date.future().getTime() / 1000),
            });

            // missing `beginSaleAt`
            await repository.save({
                name: `${faker.company.name()}${faker.string.numeric({ length: 5, allowLeadingZeros: false })}`,
                displayName: faker.company.name(),
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: anotherOrganization,
                endSaleAt: Math.floor(faker.date.future().getTime() / 1000),
            });

            // missing `endSaleAt`
            await repository.save({
                name: `${faker.company.name()}${faker.string.numeric({ length: 5, allowLeadingZeros: false })}`,
                displayName: faker.company.name(),
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: anotherOrganization,
                startSaleAt: Math.floor(faker.date.past().getTime() / 1000),
            });

            // `beginSaleAt` is the future time
            await repository.save({
                name: `${faker.company.name()}${faker.string.numeric({ length: 5, allowLeadingZeros: false })}`,
                displayName: faker.company.name(),
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                beginSaleAt: Math.floor(faker.date.future().getTime() / 1000),
                endSaleAt: Math.floor(faker.date.future().getTime() / 1000),
            });

            // `endSaleAt` is the past time
            await repository.save({
                name: `${faker.company.name()}${faker.string.numeric({ length: 5, allowLeadingZeros: false })}`,
                displayName: faker.company.name(),
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: anotherOrganization,
                beginSaleAt: Math.floor(faker.date.past().getTime() / 1000),
                endSaleAt: Math.floor(faker.date.past().getTime() / 1000),
            });

            const result = await service.countCollections({
                organization: { id: organization.id },
                beginSaleAt: LessThanOrEqual(Math.floor(new Date().getTime() / 1000)),
                endSaleAt: MoreThanOrEqual(Math.floor(new Date().getTime() / 1000)),
            });
            expect(result).toEqual(1);
        });
    });

    describe('getCollectionByAddress', () => {
        it('should get collections by organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                password: 'password',
            });

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
                owner: owner,
            });

            await repository.save({
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
            const coin = await createCoin(coinService);

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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

            await createTier(tierService, {
                totalMints: 100,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
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
            });

            await createTier(tierService, {
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
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
                password: 'password',
            });

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
                owner: owner,
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            await createCollection(service, {
                organization: { id: organization.id },
                creator: { id: wallet.id },
            });

            await createCollection(service, {
                organization: { id: organization.id },
                creator: { id: wallet.id },
            });

            const [first, second] = await service.getCreatedCollectionsByWalletId(wallet.id);

            expect(first).toBeDefined();
            expect(first.creator.id).toEqual(wallet.id);
            expect(first.organization.id).toEqual(organization.id);
            expect(first.createdAt.getTime()).toBeGreaterThanOrEqual(second.createdAt.getTime());
        });
    });

    describe('precheckCollection', () => {
        let owner;
        let organization;
        let wallet;

        beforeAll(async () => {
            owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });

            wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });
        });
        it('should validate startDate and endDate', async () => {
            await expect(
                async () =>
                    await service.precheckCollection({
                        name: faker.company.name(),
                        displayName: 'The best collection',
                        about: 'The best collection ever',
                        address: faker.finance.ethereumAddress(),
                        tags: [],
                        tiers: [
                            {
                                name: faker.company.name(),
                                totalMints: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                            },
                        ],
                        organization: {
                            id: organization.id,
                        },
                        creator: { id: wallet.id },
                        startSaleAt: faker.date.future().getTime() / 1000,
                        endSaleAt: faker.date.past().getTime() / 1000,
                    }),
            ).rejects.toThrow(`The endSaleAt should be greater than startSaleAt.`);
        });

        it('startDate should be greater than today', async () => {
            await expect(
                async () =>
                    await service.precheckCollection({
                        name: faker.company.name(),
                        displayName: 'The best collection',
                        about: 'The best collection ever',
                        address: faker.finance.ethereumAddress(),
                        tags: [],
                        tiers: [
                            {
                                name: faker.company.name(),
                                totalMints: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                            },
                        ],
                        organization: {
                            id: organization.id,
                        },
                        creator: { id: wallet.id },
                        startSaleAt: faker.date.past().getTime() / 1000,
                    }),
            ).rejects.toThrow(`The startSaleAt should be greater than today.`);
        });

        it('should pass if startDate or endDate is not provided', async () => {
            const result = await service.precheckCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                    },
                ],
                organization: {
                    id: organization.id,
                },
                creator: { id: wallet.id },
                startSaleAt: faker.date.future().getTime() / 1000,
            });
            expect(result).toEqual(true);
        });

        it('should pass if startDate and endDate are valid', async () => {
            const startSaleAt = faker.date.future({ years: 1 });
            const endSaleAt = addDays(startSaleAt, 365);
            const payload = {
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                    },
                ],
                organization: {
                    id: organization.id,
                },
                creator: { id: wallet.id },
                startSaleAt: Math.floor(startSaleAt.getTime() / 1000),
                endSaleAt: Math.floor(endSaleAt.getTime() / 1000),
            };
            const result = await service.precheckCollection(payload);
            expect(result).toEqual(true);
        });

        it('should validate name and slug', async () => {
            const creator = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });
            const collectionInput = {
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                    },
                ],
                organization: {
                    id: organization.id,
                },
                creator: { id: creator.id },
                startSaleAt: faker.date.future().getTime() / 1000,
            };
            const collectionName = collectionInput.name;
            await service.createCollection(collectionInput);
            await expect(async () => await service.precheckCollection(collectionInput)).rejects.toThrow(
                `The collection name ${collectionName} is already taken`,
            );

            // for collection slug
            await expect(
                async () =>
                    await service.precheckCollection({
                        ...collectionInput,
                        name: collectionInput.name.toUpperCase(),
                    }),
            ).rejects.toThrow(`The collection name ${collectionName.toUpperCase()} is already taken`);
        });
    });

    describe('createCollection', () => {
        it('should create a collection', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, {
                owner: owner,
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const displayName = faker.company.name();

            const collection = await createCollection(service, {
                name: '$Collection Name%',
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                    },
                ],
                organization: {
                    id: organization.id,
                },
                creator: { id: wallet.id },
                displayName,
            });

            expect(collection).toBeDefined();
            expect(collection.slug).toEqual('collection-name');
            expect(collection.displayName).toEqual(displayName);
            expect(collection.organization.id).toEqual(organization.id);
            expect(collection.creator.id).toEqual(wallet.id);
        });
    });

    describe('updateCollection', () => {
        it('should update a collection', async () => {
            const collection = await repository.save({
                name: faker.company.name(),
                slug: 'collection slug',
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                address: faker.finance.ethereumAddress(),
                tags: [],
            });

            const result = await service.updateCollection(collection.id, {
                name: faker.company.name(),
                displayName: 'The best collection ever',
            });

            const updatedCollection = await service.getCollection(collection.id);

            expect(result).toBeTruthy();
            expect(updatedCollection.slug).not.toEqual(collection.slug);
        });

        it('should update a collaboration in a collection', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
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

        it('should update beginSaleAt', async () => {
            const beginSaleAt = Math.round(new Date().valueOf() / 1000);
            const endSaleAt = Math.round(new Date().valueOf() / 1000) + 1000;

            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                address: faker.finance.ethereumAddress(),
                tags: [],
                beginSaleAt: beginSaleAt,
                endSaleAt: endSaleAt,
            });

            const result = await service.updateCollection(collection.id, {
                beginSaleAt: beginSaleAt + 100,
                endSaleAt: endSaleAt + 100,
            });

            expect(result).toBeTruthy();

            const c = await repository.findOne({ where: { id: collection.id } });
            expect(c.beginSaleAt).toBe(beginSaleAt + 100);
            expect(c.endSaleAt).toBe(endSaleAt + 100);
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
            const coin = await createCoin(coinService);

            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                address: faker.finance.ethereumAddress(),
                tags: [],
                publishedAt: null,
            });

            await createTier(tierService, {
                totalMints: 100,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
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
            });

            await createTier(tierService, {
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
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

            const txn = await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                collectionId: collection.id,
            });

            const [result] = await service.getBuyers(collection.address);
            expect(result).toEqual(txn.recipient);
        });
    });

    describe('getCollectionByQuery', () => {
        let coin;
        let owner;
        let organization;
        let collection;

        beforeEach(async () => {
            coin = await createCoin(coinService);
            owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            organization = await createOrganization(organizationService, {
                owner,
            });

            collection = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: { id: organization.id },
                tiers: [
                    {
                        paymentTokenAddress: coin.address,
                        name: faker.company.name(),
                        totalMints: 200,
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
            });
        });

        it('should return collection with organization info', async () => {
            const result = await service.getCollectionByQuery({ id: collection.id });
            expect(result.id).toEqual(collection.id);
            expect(result.address).toEqual(collection.address);
            expect(result.organization.name).not.toBeNull();
        });

        it('should get tiers by collection id', async () => {
            const result = await service.getCollectionTiers(collection.id);
            expect(result.length).toEqual(1);
        });
    });

    describe('getCollectionStat', () => {
        let collection: Collection;

        beforeEach(async () => {
            const coin = await createCoin(coinService);

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
            });
        });

        it('should return the right response from opensea', async () => {
            const mockResponse = [
                {
                    source: 'opensea',
                    data: {
                        supply: faker.number.float(),
                        floorPrice: faker.number.float(),
                        volume: {
                            hourly: faker.number.float(),
                            daily: faker.number.float(),
                            weekly: faker.number.float(),
                            total: faker.number.float(),
                        },
                        sales: {
                            hourly: faker.number.float(),
                            daily: faker.number.float(),
                            weekly: faker.number.float(),
                            total: faker.number.float(),
                            monthly: faker.number.float(),
                        },
                        netGrossEarning: faker.number.float(),
                    },
                },
            ] as CollectionStat[];

            jest.spyOn(service, 'getSecondaryMarketStat').mockImplementation(async () => mockResponse);
            const result = await service.getSecondaryMarketStat({ address: collection.address });
            expect(result.length).toEqual(1);
            expect(result[0].source).toEqual('opensea');
        });
    });

    describe('getHolders', () => {
        const collectionAddress = faker.finance.ethereumAddress().toLowerCase();
        const tokenAddress = faker.finance.ethereumAddress().toLowerCase();
        const owner1 = faker.finance.ethereumAddress().toLowerCase();
        const tokenId1 = faker.string.numeric({ length: 5, allowLeadingZeros: false });

        const owner2 = faker.finance.ethereumAddress().toLowerCase();
        const tokenId2 = faker.string.numeric({ length: 5, allowLeadingZeros: false });
        let organization;
        let coin;

        beforeEach(async () => {
            const beginTime = Math.floor(faker.date.recent().getTime() / 1000);

            coin = await createCoin(coinService);

            const user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            organization = await organizationService.createOrganization({
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

            const collection = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: collectionAddress,
                tags: [],
                organization: { id: organization.id },
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
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
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
                        tierId: 1,
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
            });

            await createMintSaleContract(mintSaleContractService, {
                address: collectionAddress,
                beginTime,
                endTime: beginTime + 86400,
                tokenAddress,
                collectionId: collection.id,
            });

            await createAsset721(asset721Service, {
                address: tokenAddress,
                tokenId: tokenId1,
                owner: owner1,
            });
            await createAsset721(asset721Service, {
                address: tokenAddress,
                tokenId: tokenId2,
                owner: owner2,
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                tierId: 0,
                tokenAddress,
                tokenId: tokenId1,
                price: '100',
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                tierId: 1,
                tokenAddress,
                tokenId: tokenId2,
                price: '100',
            });
        });

        it('should get holders', async () => {
            const tokenId3 = faker.string.numeric({ length: 5, allowLeadingZeros: false });

            // Total count won't include duplicates
            await createAsset721(asset721Service, {
                address: tokenAddress,
                tokenId: tokenId3,
                owner: owner2,
            });
            await createMintSaleTransaction(mintSaleTransactionService, {
                tierId: 1,
                tokenAddress,
                tokenId: tokenId3,
                price: '100',
            });

            const result = await service.getHolders(collectionAddress, '', '', 10, 0);
            expect(result).toBeDefined();
            expect(result.totalCount).toEqual(2);
            expect(result.edges.length).toEqual(2);
            expect(result.edges[0].node.tier).toBeDefined();
            // Assert the sorting is correct.
            expect(result.edges[0].node.quantity).toBe(2);

            const holder1 = result.edges.find((edge) => edge.node.address === owner1)?.node;
            expect(holder1.quantity).toBe(1);
            expect(holder1.price).toBe('100');
            expect(holder1.totalPrice).toBe('100');
            expect(holder1.address).toBe(owner1);

            const holder2 = result.edges.find((edge) => edge.node.address === owner2)?.node;
            expect(holder2.quantity).toBe(2);
            expect(holder2.price).toBe('100');
            expect(holder2.totalPrice).toBe('200');
            // Assert the owner shows even it can't be find in the wallet repo
            expect(holder2.address).toBe(owner2);
        });

        it('should get unique holders', async () => {
            const tokenId3 = faker.string.numeric({ length: 5, allowLeadingZeros: false });
            await createAsset721(asset721Service, {
                address: tokenAddress,
                tokenId: tokenId3,
                owner: owner2,
            });
            await createMintSaleTransaction(mintSaleTransactionService, {
                tierId: 1,
                tokenAddress,
                tokenId: tokenId3,
                price: '100',
            });
            const result = await service.getUniqueHolderCount(collectionAddress);
            expect(result).toEqual(2);
        });

        it('should get activities', async () => {
            const result = await service.getCollectionActivities(collectionAddress, 0, 10);
            expect(result).toBeDefined();
            expect(result.total).toEqual(2);
            expect(result.data.length).toEqual(2);
            expect(result.data[0].tier).toBeDefined();
            expect(result.data[0].tier.price).toEqual('200');
            expect(result.data[0].transaction).toBeDefined();
        });

        it('should get lending page collections', async () => {
            const result = await service.getLandingPageCollections(CollectionStatus.active, 0, 10, []);
            expect(result).toBeDefined();
            expect(result.total).toEqual(1);
            expect(result.data).toBeDefined();
            expect(result.data.length).toEqual(1);
            expect(result.data[0].address).toEqual(collectionAddress);
        });

        it('should get lending page collections given ids', async () => {
            const beginTime = Math.floor(faker.date.recent().getTime() / 1000);
            const collection = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress().toLowerCase(),
                tags: [],
                organization: { id: organization.id },
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
                        tierId: 1,
                        price: '200',
                        metadata: {},
                    },
                ],
            });

            await createMintSaleContract(mintSaleContractService, {
                address: collection.address,
                beginTime,
                endTime: beginTime + 864000,
                tokenAddress,
                collectionId: collection.id,
            });

            const result = await service.getLandingPageCollections(CollectionStatus.active, 0, 10, [collection.id]);
            expect(result).toBeDefined();
            expect(result.total).toEqual(1);
            expect(result.data.length).toEqual(1);
            expect(result.data[0].address).toEqual(collection.address);
        });
    });

    describe('Get Collection By Paging', () => {
        let collection1: Collection;
        let cursor: string;

        beforeEach(async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            collection1 = await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            await service.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });
        });

        it('should get the first page', async () => {
            const result = await service.getCollections('', '', 1, 1);
            cursor = result.pageInfo.endCursor;
            expect(result).toBeDefined();
            expect(result.pageInfo.startCursor).toBeDefined();
            expect(result.pageInfo.endCursor).toBeDefined();
            expect(result.edges[0]).toBeDefined();
            expect(result.edges[0].node.id).toEqual(collection1.id);
            expect(result.totalCount).toEqual(2);
        });

        it(`should get the second page through the endCursor of the first page`, async () => {
            const result = await service.getCollections('', cursor, 1, 1);
            expect(result).toBeDefined();
            expect(result.pageInfo.startCursor).toBeDefined();
            expect(result.pageInfo.endCursor).toBeDefined();
            expect(result.edges[0]).toBeDefined();
            // expect(result.edges[0].node.id).toEqual(collection2.id);
            expect(result.totalCount).toEqual(2);
        });
    });

    describe('getSecondarySale', () => {
        it('should return Secondary Sale', async () => {
            const mockResponse = {
                total: faker.number.float(),
            };
            jest.spyOn(service, 'getSecondarySale').mockImplementation(async () => mockResponse);
            const result = await service.getSecondarySale(faker.finance.ethereumAddress());
            expect(result.total).toBeDefined();
        });
    });

    describe('getCollectionEarningsByTokenAddress', () => {
        it('should return correct sum of earnings for the given token address', async () => {
            const price = faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false });
            const paymentToken = faker.finance.ethereumAddress();

            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                publishedAt: new Date(),
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                tierId: 0,
                price,
                collectionId: collection.id,
                paymentToken,
            });

            const earnings = await service.getCollectionEarningsByCollectionAddress(collection.address);
            expect(earnings).toBeDefined();
            expect(earnings.token).toBe(paymentToken);
            expect(earnings.totalPrice).toBe(price);
        });

        it('should return null if there are no mint sale transaction', async () => {
            const collection = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                publishedAt: new Date(),
            });

            const earnings = await service.getCollectionEarningsByCollectionAddress(collection.address);

            expect(earnings).toEqual(null);
        });
    });

    describe('getCollectionSold', () => {
        it('should return the sale history per collection.', async () => {
            const sender1 = faker.finance.ethereumAddress();
            const paymentToken = faker.finance.ethereumAddress();
            const collectionAddress = faker.finance.ethereumAddress();

            const collection = await createCollection(service, {
                address: collectionAddress,
            });

            const tier = await createTier(tierService, {
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
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
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                sender: sender1,
                address: collection.address,
                tierId: tier.tierId,
                paymentToken,
            });
            await createMintSaleTransaction(mintSaleTransactionService, {
                sender: sender1,
                address: collection.address,
                tierId: tier.tierId,
                paymentToken,
            });

            const result = await service.getCollectionSold(collection.address, '', '', 10, 0);
            expect(result.edges).toBeDefined();
            expect(result.edges.length).toBe(2);
            expect(result.edges[0].node).toBeDefined();
            expect(result.edges[0].node.address).toBe(collectionAddress);
            expect(result.totalCount).toBe(2);
        });
    });

    describe('getOwners', () => {
        it('should be return owners count', async () => {
            const collectionAddress = faker.finance.ethereumAddress();

            const collection = await createCollection(service, {
                address: collectionAddress,
            });

            const tier = await createTier(tierService, {
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
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
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                tierId: tier.tierId,
            });
            await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                tierId: tier.tierId,
            });

            const result = await service.getOwners(collection.address);
            expect(result).toBe(2);
        });
    });

    describe('getSevenDayVolume', () => {
        it('should be return 7day volume', async () => {
            const collectionAddress = faker.finance.ethereumAddress();

            const collection = await createCollection(service, {
                address: collectionAddress,
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                tierId: 1,
            });
            await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                tierId: 1,
            });

            const mockResponse = {
                inUSDC: '100',
                inPaymentToken: '100',
                paymentToken: faker.finance.ethereumAddress(),
            };

            jest.spyOn(service, 'getSevenDayVolume').mockImplementation(async () => mockResponse);
            const result = await service.getSevenDayVolume(collectionAddress);

            expect(result).toBeDefined();
            expect(result.inUSDC).toBe('100');
            expect(result.paymentToken).toBe(mockResponse.paymentToken);
        });
    });

    describe('getGrossEarnings', () => {
        it('should test gross earnings', async () => {
            const collectionAddress = faker.finance.ethereumAddress();

            await createCollection(service, {
                address: collectionAddress,
            });

            // should return 0
            const result = await service.getGrossEarnings(collectionAddress);
            expect(result).toBeDefined();
            expect(result.inPaymentToken).toBe('0');
            expect(result.inUSDC).toBe('0');

            const collectionAddress1 = faker.finance.ethereumAddress();
            const collection = await createCollection(service, {
                address: collectionAddress1,
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                tierId: 1,
            });
            await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                tierId: 1,
            });

            const mockResponse = {
                inUSDC: '100',
                inPaymentToken: '100',
                paymentToken: faker.finance.ethereumAddress(),
            };
            jest.spyOn(service, 'getGrossEarnings').mockImplementation(async () => mockResponse);
            const result1 = await service.getGrossEarnings(collectionAddress);
            expect(result1).toBeDefined();
            expect(result1.inUSDC).toBe('100');
            expect(result1.paymentToken).toBe(mockResponse.paymentToken);
        });
    });

    describe('getAggregatedCollectionsByOrganizationId', () => {
        it('should return the number of collections', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const result = await service.getAggregatedCollectionsByOrganizationId(organization.id);
            expect(result.monthly).toBe(2);
            expect(result.weekly).toBe(2);
            expect(result.daily).toBe(2);
        });

        it('should return 0, if this organization has not been created.', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            const result = await service.getAggregatedCollectionsByOrganizationId(organization.id);
            expect(result.daily).toBe(0);
            expect(result.weekly).toBe(0);
            expect(result.monthly).toBe(0);
        });

        it('should return the number of collections created this month', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            const month = new Date().getMonth();

            // two months before this month
            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                createdAt: new Date(new Date().setMonth(month - 2)),
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const result = await service.getAggregatedCollectionsByOrganizationId(organization.id);
            expect(result.monthly).toBe(1);
            expect(result.weekly).toBe(1);
            expect(result.daily).toBe(1);
        });

        it('should return the number of collections created under this organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            // the other organization
            const organization2 = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: owner,
            });
            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection2',
                about: 'The best collection ever2',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization2,
            });

            const result = await service.getAggregatedCollectionsByOrganizationId(organization.id);
            expect(result.monthly).toBe(1);
            expect(result.weekly).toBe(1);
            expect(result.daily).toBe(1);

            const result2 = await service.getAggregatedCollectionsByOrganizationId(organization2.id);
            expect(result2.monthly).toBe(1);
        });

        it('should return the last 7/30 days collections', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                createdAt: subDays(new Date(), 29),
            });

            // 31 days ago
            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection1',
                about: 'The best collection ever1',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                createdAt: subDays(new Date(), 31),
            });
            const result = await service.getAggregatedCollectionsByOrganizationId(organization.id);
            expect(result.last30Days).toBe(1);

            // test for last7Days
            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection2',
                about: 'The best collection ever2',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                createdAt: subDays(new Date(), 5),
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection3',
                about: 'The best collection ever3',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                createdAt: subDays(new Date(), 8), // 8days ago
            });
            const result1 = await service.getAggregatedCollectionsByOrganizationId(organization.id);
            expect(result1.last7Days).toBe(1);
        });
    });

    describe('getCreatedCollectionsByWalletAddress', () => {
        it('should return the collections created by the wallet', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const hdWallet = ethers.Wallet.createRandom();
            const wallet = await walletService.createWallet({ address: hdWallet.address });

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
                creator: { id: wallet.id },
            });

            const collections = await service.getCreatedCollectionsByWalletAddress(wallet.address);
            expect(collections.length).toBe(1);
            expect(collections[0].name).toBe(collection.name);
        });

        it('should not return the collections, if no published', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const hdWallet = ethers.Wallet.createRandom();
            const wallet = await walletService.createWallet({ address: hdWallet.address });

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
                owner: owner,
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const collections = await service.getCreatedCollectionsByWalletAddress(wallet.address);
            expect(collections.length).toBe(0);
        });

        it('should return the collections created by the correct wallet', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const hdWallet = ethers.Wallet.createRandom();
            const wallet = await walletService.createWallet({ address: hdWallet.address });

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
                owner: owner,
            });

            const collection1 = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const anotherHDWallet = ethers.Wallet.createRandom();
            const anotherWallet = await walletService.createWallet({ address: anotherHDWallet.address });
            const collection2 = await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection1',
                about: 'The best collection ever1',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: anotherWallet.id },
            });

            const collections1 = await service.getCreatedCollectionsByWalletAddress(wallet.address);
            expect(collections1.length).toBe(1);
            expect(collections1[0].name).toBe(collection1.name);

            const collections2 = await service.getCreatedCollectionsByWalletAddress(anotherWallet.address);
            expect(collections2.length).toBe(1);
            expect(collections2[0].name).toBe(collection2.name);
        });
    });

    describe('getCollectionsByUserId', () => {
        it('should return the number of collections by user', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const hdWallet = ethers.Wallet.createRandom();
            const wallet = await walletService.createWallet({ address: hdWallet.address, ownerId: owner.id });

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
                owner: owner,
            });
            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });
            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection1',
                about: 'The best collection ever1',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const result = await service.getCollectionsByUserId(owner.id);
            expect(result.length).toBe(2);
        });

        it('should return the number of collections by user, multiple wallets', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const hdWallet = ethers.Wallet.createRandom();
            const wallet = await walletService.createWallet({ address: hdWallet.address, ownerId: owner.id });

            const hdWallet2 = ethers.Wallet.createRandom();
            const wallet2 = await walletService.createWallet({ address: hdWallet2.address, ownerId: owner.id });

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
                owner: owner,
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection1',
                about: 'The best collection ever1',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection2',
                about: 'The best collection ever2',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet2.id },
            });

            const result = await service.getCollectionsByUserId(owner.id);
            expect(result.length).toBe(3);
        });
    });

    describe('getCollectionsByOrganizationIdAndBeginTime', () => {
        it('should be return the number of collections by today', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                createdAt: startOfDay(new Date()),
            });

            const result = await service.getCollectionsByOrganizationIdAndBeginTime(
                organization.id, startOfDay(new Date()));
            expect(result).toBe(1);
        });

        it('should be return the number of collections by this week', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                createdAt: startOfWeek(new Date()),
            });

            const result1 = await service.getCollectionsByOrganizationIdAndBeginTime(
                organization.id, startOfWeek(new Date()));
            expect(result1).toBe(1);
        });

        it('should be return the number of collections by this month', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            await repository.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                createdAt: startOfMonth(new Date()),
            });

            const result2 = await service.getCollectionsByOrganizationIdAndBeginTime(
                organization.id, startOfMonth(new Date()));
            expect(result2).toBe(1);
        });
    });

    describe('getAggregatedCollectionActivities', () => {
        const collectionAddress = faker.finance.ethereumAddress().toLowerCase();
        const tokenAddress = faker.finance.ethereumAddress().toLowerCase();
        const walletAddress1 = faker.finance.ethereumAddress().toLowerCase();
        const txHash1 = faker.string.hexadecimal({ length: 66, casing: 'lower' });
        const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
        const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
        const tokenId3 = faker.string.numeric({ length: 3, allowLeadingZeros: false });

        beforeEach(async () => {
            const coin = await createCoin(coinService);

            const user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, { owner: user });

            await service.createCollectionWithTiers({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                about: faker.commerce.productDescription(),
                address: collectionAddress,
                tags: [],
                organization: { id: organization.id },
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
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
            });

            const transactionContent = {
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash1,
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: walletAddress1,
                address: collectionAddress,
                tierId: 0,
                tokenAddress,
                paymentToken: coin.address,
            };

            // minted 3 in one transaction
            await createMintSaleTransaction(mintSaleTransactionService, {
                tokenId: tokenId1,
                price: '1000000000000000000',
                ...transactionContent,
            });
            await createHistory721(history721Service, {
                address: tokenAddress,
                tokenId: tokenId1,
                kind: History721Type.mint,
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                tokenId: tokenId2,
                price: '2000000000000000000',
                ...transactionContent,
            });
            await createHistory721(history721Service, {
                address: tokenAddress,
                tokenId: tokenId2,
                kind: History721Type.mint,
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                tokenId: tokenId3,
                price: '3000000000000000000',
                ...transactionContent,
            });
            await createHistory721(history721Service, {
                address: tokenAddress,
                tokenId: tokenId3,
                kind: History721Type.mint,
            });

            // another transaction -> transfer
            await createHistory721(history721Service, {
                address: tokenAddress,
                tokenId: tokenId3,
                kind: History721Type.transfer,
            });
        });

        it('should work', async () => {
            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });
            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getAggregatedCollectionActivities(
                collectionAddress, tokenAddress, '', '', 10, 10);
            expect(result.totalCount).toEqual(4);
            expect(result.edges.length).toEqual(4);

            const mintEvent = result.edges.filter((data) => {
                return data.node.type == CollectionActivityType.Mint;
            });
            expect(mintEvent.length).toBe(3);

            const tokenId1Mint = mintEvent.find((data) => {
                return data.node.tokenId == tokenId1;
            });
            expect(tokenId1Mint).toBeDefined();
            expect(tokenId1Mint.node.type).toBe(CollectionActivityType.Mint);
            expect(tokenId1Mint.node.cost.inPaymentToken).toBe('1');
            expect(tokenId1Mint.node.cost.inUSDC).toBe((tokenPriceUSD * 1).toString());

            const tokenId2Mint = mintEvent.find((data) => {
                return data.node.tokenId == tokenId2;
            });
            expect(tokenId2Mint).toBeDefined();
            expect(tokenId2Mint.node.type).toBe(CollectionActivityType.Mint);
            expect(tokenId2Mint.node.cost.inPaymentToken).toBe('2');
            expect(tokenId2Mint.node.cost.inUSDC).toBe((tokenPriceUSD * 2).toString());

            const tokenId3Mint = mintEvent.find((data) => {
                return data.node.tokenId == tokenId3;
            });
            expect(tokenId3Mint).toBeDefined();
            expect(tokenId3Mint.node.type).toBe(CollectionActivityType.Mint);
            expect(tokenId3Mint.node.cost.inPaymentToken).toBe('3');
            expect(tokenId3Mint.node.cost.inUSDC).toBe((tokenPriceUSD * 3).toString());

            const transferEvent = result.edges.filter((data) => {
                return data.node.type == CollectionActivityType.Transfer;
            });
            expect(transferEvent.length).toBe(1);
            expect(transferEvent[0].node.cost.inPaymentToken).toBe('0');
            expect(transferEvent[0].node.tokenId).toBe(tokenId3);
            expect(transferEvent[0].node.type).toBe(CollectionActivityType.Transfer);
        });

        it('should fetched vai paging', async () => {
            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });
            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getAggregatedCollectionActivities(
                collectionAddress, tokenAddress, '', '', 1, 1);
            expect(result.edges.length).toBe(1);
            expect(result.edges[0].node.tokenId).toBe(tokenId1);

            const result1 = await service.getAggregatedCollectionActivities(
                collectionAddress, tokenAddress, '', result.pageInfo.endCursor, 1, 1);
            expect(result1.edges.length).toBe(1);
            expect(result1.edges[0].node.tokenId).toBe(tokenId2);
        });
    });

    describe('getCollectionEarningsChart', () => {
        it('should return the earnings chart', async () => {
            const coin = await createCoin(coinService);

            const user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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

            const collection = await service.createCollectionWithTiers({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                about: faker.commerce.productDescription(),
                address: faker.commerce.productDescription(),
                tags: [],
                organization: { id: organization.id },
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
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
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                tierId: 0,
                price: '1000000000000000000',
                paymentToken: coin.address,
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getCollectionEarningsChart(collection.address, '', '', 10, 10);
            expect(result.totalCount).toBe(1);
            expect(result.edges).toBeDefined();
            expect(result.edges.length).toBe(1);
            expect(result.edges[0].node.volume).toEqual({
                paymentToken: coin.address,
                inUSDC: tokenPriceUSD.toString(),
                inPaymentToken: '1',
            });
        });
    });

    describe('getAggregatedVolumes', () => {
        it('should get aggregated volumes', async () => {
            const coin = await createCoin(coinService);

            const collection = await createCollection(service);

            await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                tierId: 1,
                price: '1000000000000000000',
                paymentToken: coin.address,
                txTime: Math.floor(new Date().getTime() / 1000),
            });
            await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                tierId: 1,
                price: '1000000000000000000',
                paymentToken: coin.address,
                txTime: Math.floor(new Date().getTime() / 1000),
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getAggregatedVolumes(collection.address);
            expect(result).toBeDefined();
            expect(result.total).toBeDefined();
            expect(result.total.inPaymentToken).toBe('2');
            expect(result.total.inUSDC).toBe((tokenPriceUSD * 2).toString());

            expect(result.monthly).toBeDefined();
            expect(result.monthly.inPaymentToken).toBe('2');
            expect(result.monthly.inUSDC).toBe((tokenPriceUSD * 2).toString());

            expect(result.weekly).toBeDefined();
            expect(result.weekly.inPaymentToken).toBe('2');
            expect(result.weekly.inUSDC).toBe((tokenPriceUSD * 2).toString());
        });
    });

    describe('getAggregatedCollectionSold', () => {
        const collectionAddress = faker.finance.ethereumAddress().toLowerCase();
        const tokenAddress = faker.finance.ethereumAddress().toLowerCase();
        const walletAddress1 = faker.finance.ethereumAddress().toLowerCase();
        const walletAddress2 = faker.finance.ethereumAddress().toLowerCase();
        const txHash1 = faker.string.hexadecimal({ length: 66, casing: 'lower' });
        const txHash2 = faker.string.hexadecimal({ length: 66, casing: 'lower' });
        let collection;

        beforeEach(async () => {
            // jest.resetAllMocks();

            const coin = await createCoin(coinService);

            const user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, { owner: user });
            collection = await service.createCollectionWithTiers({
                name: faker.commerce.productName(),
                displayName: faker.commerce.productName(),
                about: faker.commerce.productDescription(),
                address: collectionAddress,
                tags: [],
                organization: { id: organization.id },
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: coin.address,
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
            });

            const transactionContent = {
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash1,
                txTime: Math.floor(new Date().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: walletAddress1,
                address: collectionAddress,
                tierId: 0,
                tokenAddress,
                paymentToken: coin.address,
            };

            const assetContent = {
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
            };

            // minted 3 in one transaction
            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            await createMintSaleTransaction(mintSaleTransactionService, {
                tokenId: tokenId1,
                price: '1000000000000000000',
                ...transactionContent,
            });
            await createAsset721(asset721Service, {
                tokenId: tokenId1,
                owner: walletAddress1,
                ...assetContent,
            });

            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            await createMintSaleTransaction(mintSaleTransactionService, {
                tokenId: tokenId2,
                price: '2000000000000000000',
                ...transactionContent,
            });
            await createAsset721(asset721Service, {
                tokenId: tokenId2,
                owner: walletAddress1,
                ...assetContent,
            });

            const tokenId3 = faker.string.numeric({ length: 3, allowLeadingZeros: false });
            await createMintSaleTransaction(mintSaleTransactionService, {
                tokenId: tokenId3,
                price: '3000000000000000000',
                ...transactionContent,
            });
            await createAsset721(asset721Service, {
                tokenId: tokenId3,
                owner: walletAddress1,
                ...assetContent,
            });

            // another transaction
            const tokenId4 = faker.string.numeric({ length: 4, allowLeadingZeros: false });
            const anotherTransactionContent = Object.assign(transactionContent, {
                tokenId: tokenId4,
                price: '4000000000000000000',
                recipient: walletAddress2,
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash2,
                txTime: Math.floor(new Date().getTime() / 1000),
            });
            await createMintSaleTransaction(mintSaleTransactionService, anotherTransactionContent);
            await createAsset721(asset721Service, {
                tokenId: tokenId4,
                owner: walletAddress2,
                ...assetContent,
            });
        });

        afterAll(async () => {
            jest.resetAllMocks();
        });

        it('should retrieve the aggregated collection sold', async () => {
            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getAggregatedCollectionSold(collectionAddress, tokenAddress);
            expect(result.total).toEqual(2);
            expect(result.data.length).toEqual(2);
            const aggregation1 = result.data.find((item) => item.txHash === txHash1);
            expect(aggregation1.tokenIds.length).toEqual(3);
            expect(aggregation1.tier.name).toEqual(collection.tiers[0].name);
            const aggregation2 = result.data.find((item) => item.txHash === txHash2);
            expect(aggregation2.tokenIds.length).toEqual(1);
        });

        it('should return cost object', async () => {
            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getAggregatedCollectionSold(collectionAddress, tokenAddress);
            expect(result.total).toEqual(2);
            expect(result.data.length).toEqual(2);
            const aggregation1 = result.data.find((item) => item.txHash === txHash1);
            expect(aggregation1.tokenIds.length).toEqual(3);
            expect(aggregation1.tier.name).toEqual(collection.tiers[0].name);
            expect(aggregation1.cost.inPaymentToken).toBe('6');
            expect(aggregation1.cost.inUSDC).toBe((tokenPriceUSD * 6).toString());
            const aggregation2 = result.data.find((item) => item.txHash === txHash2);
            expect(aggregation2.tokenIds.length).toEqual(1);
        });

        it('should sort results by txTime in descending order', async () => {
            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getAggregatedCollectionSold(collectionAddress, tokenAddress);
            for (let i = 0; i < result.data.length - 1; i++) {
                expect(result.data[i].txTime).toBeGreaterThanOrEqual(result.data[i + 1].txTime);
            }
        });

        it('should throw an error if getAggregatedCollectionTransaction fails', async () => {
            const error = new Error('Something went wrong');
            jest.spyOn(service['transactionService'], 'getAggregatedCollectionTransaction').mockRejectedValue(error);

            await expect(service.getAggregatedCollectionSold(collectionAddress, tokenAddress)).rejects.toThrow(error);
        });

        it('should throw an error if fetching assets fails', async () => {
            const error = new Error('Failed to fetch assets');
            jest.spyOn(service['asset721Repository'], 'createQueryBuilder').mockImplementation(() => {
                throw error;
            });

            await expect(service.getAggregatedCollectionSold(collectionAddress, tokenAddress)).rejects.toThrow(error);
        });
    });

    describe('searchTokenIds', () => {
        let user;
        let wallet;
        let organization;
        let collection;
        let tier;

        beforeEach(async () => {
            user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            organization = await createOrganization(organizationService, { owner: user });

            wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            collection = await createCollection(service, {
                organization,
                creator: { id: wallet.id },
            });
            await createTierAndMintSaleContract(
                {
                    tierId: 0,
                    metadata: {
                        properties: {
                            height: {
                                value: '200',
                            },
                        },
                    },
                },
                {
                    tierId: 0,
                    startId: 0,
                    endId: 2,
                },
            );

            await createTierAndMintSaleContract(
                {
                    tierId: 1,
                    metadata: {
                        properties: {
                            type: {
                                value: 'silver',
                            },
                            height: {
                                value: '100',
                            },
                        },
                    },
                },
                {
                    tierId: 1,
                    startId: 3,
                    endId: 5,
                },
            );

            await createTierAndMintSaleContract(
                {
                    tierId: 2,
                    metadata: {
                        properties: {
                            type: {
                                value: 'golden',
                            },
                            height: {
                                value: '100',
                            },
                        },
                    },
                },
                {
                    tierId: 2,
                    startId: 6,
                    endId: 8,
                },
            );

            tier = await createTierAndMintSaleContract(
                {
                    tierId: 3,
                    metadata: {
                        properties: {
                            type: {
                                value: 'golden',
                            },
                            height: {
                                value: '200',
                            },
                        },
                    },
                },
                {
                    tierId: 3,
                    startId: 9,
                    endId: 11,
                },
            );

            await createTierAndMintSaleContract(
                {
                    tierId: 4,
                    metadata: {
                        properties: {
                            type: {
                                value: 'golden',
                            },
                            height: {
                                value: '300',
                            },
                        },
                    },
                },
                {
                    tierId: 4,
                    startId: 12,
                    endId: 14,
                },
            );

            await createTierAndMintSaleContract(
                {
                    tierId: 5,
                    metadata: {
                        properties: {
                            type: {
                                value: 'golden',
                            },
                            height: {
                                value: '400',
                            },
                        },
                    },
                },
                {
                    tierId: 5,
                    startId: 15,
                    endId: 17,
                },
            );
        });

        const createTierAndMintSaleContract = async (tierData, mintSaleContractData) => {
            await createMintSaleContract(mintSaleContractService, {
                address: collection.address,
                ...mintSaleContractData,
            });

            return await createTier(tierService, {
                collection: { id: collection.id },
                ...tierData,
            });
        };

        it('should return the right ranges when getTokenIdRangesByStaticPropertiesFilters', async () => {
            const allTokenIdsRange = await service.getTokenIdRangesByStaticPropertiesFilters(
                collection.id, collection.address, []);
            expect(allTokenIdsRange.length).toBe(6);
            expect(allTokenIdsRange).toEqual([
                [0, 2],
                [3, 5],
                [6, 8],
                [9, 11],
                [12, 14],
                [15, 17],
            ]);
            const typeFilter = [
                {
                    name: 'type',
                    value: 'golden',
                },
            ];
            const rangesWithTypeFilter = await service.getTokenIdRangesByStaticPropertiesFilters(
                collection.id, collection.address, typeFilter);
            expect(rangesWithTypeFilter.length).toBe(4);
            expect(rangesWithTypeFilter).toEqual([
                [6, 8],
                [9, 11],
                [12, 14],
                [15, 17],
            ]);

            const heightFilter = [
                {
                    name: 'height',
                    range: [200, 300],
                },
            ];

            const rangesWithHeightFilter = await service.getTokenIdRangesByStaticPropertiesFilters(
                collection.id, collection.address, heightFilter);
            expect(rangesWithHeightFilter.length).toBe(3);
            expect(rangesWithHeightFilter).toEqual([
                [0, 2],
                [9, 11],
                [12, 14],
            ]);

            const combinedFilter = [...typeFilter, ...heightFilter];
            const combinedRanges = await service.getTokenIdRangesByStaticPropertiesFilters(
                collection.id, collection.address, combinedFilter);
            // It's OR condition now
            expect(combinedRanges.length).toBe(5);
            expect(combinedRanges).toEqual([
                [0, 2],
                [6, 8],
                [9, 11],
                [12, 14],
                [15, 17],
            ]);
        });

        it('should return the right tokenIds when searchTokenIds', async () => {
            const collectionId = collection.id;
            const tierId = tier.id;
            await nftService.createOrUpdateNftByTokenId({
                collectionId,
                tierId,
                tokenId: '9',
                properties: {
                    loyalty: {
                        value: '150',
                    },
                },
            });
            await nftService.createOrUpdateNftByTokenId({
                collectionId,
                tierId,
                tokenId: '10',
                properties: {
                    loyalty: {
                        value: '50',
                    },
                },
            });
            await nftService.createOrUpdateNftByTokenId({
                collectionId,
                tierId,
                tokenId: '11',
                properties: {
                    loyalty: {
                        value: '250',
                    },
                },
            });
            const searchInput = {
                collectionId: collection.id,
                staticPropertyFilters: [
                    {
                        name: 'type',
                        value: 'golden',
                    },
                    {
                        name: 'height',
                        range: [200, 300],
                    },
                ],
                dynamicPropertyFilters: [
                    {
                        name: 'loyalty',
                        range: [100, 400],
                    },
                ],
            };
            const tokenIds = await service.searchTokenIds(searchInput);
            expect(tokenIds.length).toBe(3);
            expect(tokenIds).toEqual(expect.arrayContaining(['9', '10', '11']));
        });
    });

    describe('getPluginsOverview', function () {
        let collection;
        let plugin;
        let merkleTree;

        beforeEach(async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, { owner: user });
            collection = await createCollection(service, { organization });
            merkleTree = await createRecipientsMerkleTree(merkleTreeService, collection.address, [1, 2, 3]);
            plugin = await createPlugin(pluginRepository, { organization });
        });

        it('should return right plugin overview', async () => {
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'collection plugin without merkle root',
                pluginDetail: {},
            };
            await collectionPluginService.createCollectionPlugin(input);
            await collectionPluginService.createCollectionPlugin({
                ...input,
                merkleRoot: merkleTree.merkleRoot,
                name: 'collection plugin with merkle root',
            });
            const result = await service.getPluginsOverview(collection.id, 100);
            expect(result.length).toBe(2);
            expect(result).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'collection plugin without merkle root',
                        pluginName: plugin.name,
                        count: 100,
                    }),
                    expect.objectContaining({
                        name: 'collection plugin with merkle root',
                        pluginName: plugin.name,
                        count: 3,
                    }),
                ]),
            );
        });
    });

    describe('getMetadataOverview', function () {
        let user;
        let wallet;
        let organization;
        let collection;
        let plugin;
        let merkleTree;

        const createTierNftAndMintSaleContract = async (tierData, mintSaleContractData) => {
            await createMintSaleContract(mintSaleContractService, {
                address: collection.address,
                ...mintSaleContractData,
            });

            await createTier(tierService, {
                collection: { id: collection.id },
                ...tierData,
            });
            await nftService.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tierData.id,
                tokenId: faker.string.numeric({ length: 1, allowLeadingZeros: false }),
                properties: tierData.metadata.properties,
                ownerAddress: faker.finance.ethereumAddress(),
            });
            return;
        };

        beforeEach(async () => {
            // create collection
            user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            organization = await createOrganization(organizationService, { owner: user });
            wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });
            collection = await createCollection(service, {
                organization,
                creator: { id: wallet.id },
            });
            // create tiers and mint sale contracts
            await createTierNftAndMintSaleContract(
                {
                    tierId: 0,
                    metadata: {
                        properties: {
                            Color: {
                                name: 'Color',
                                type: 'string',
                                value: 'Red',
                                class: 'upgradable',
                            },
                            Height: {
                                name: 'Height',
                                type: 'number',
                                value: 180,
                                class: 'upgradable',
                            },
                        },
                        uses: ['@vibe_lab/loyalty_points', '@vibe_lab/magic_rule_engine', '@vibe_lab/airdrop'],
                    },
                },
                {
                    collectionId: collection.id,
                    tierId: 0,
                    startId: 1,
                    endId: 9,
                },
            );

            await createTierNftAndMintSaleContract(
                {
                    tierId: 1,
                    metadata: {
                        properties: {
                            BgColor: {
                                name: 'BgColor',
                                type: 'string',
                                value: 'Green',
                            },
                            Width: {
                                name: 'Width',
                                type: 'number',
                                value: 30,
                            },
                        },
                        uses: ['@vibe_lab/magic_rule_engine', '@vibe_lab/airdrop'],
                    },
                },
                {
                    collectionId: collection.id,
                    tierId: 1,
                    startId: 10,
                    endId: 30,
                },
            );

            await createTierNftAndMintSaleContract(
                {
                    tierId: 2,
                    metadata: {
                        properties: {
                            Color: {
                                name: 'Color',
                                type: 'string',
                                value: 'Green',
                                class: 'upgradable',
                            },
                            Type: {
                                name: 'Type',
                                type: 'string',
                                value: 'Golden',
                            },
                            Height: {
                                name: 'Height',
                                type: 'number',
                                value: 190,
                                class: 'upgradable',
                            },
                        },
                        uses: ['@vibe_lab/loyalty_points', '@vibe_lab/airdrop'],
                    },
                },
                {
                    collectionId: collection.id,
                    tierId: 2,
                    startId: 31,
                    endId: 99,
                },
            );
            // create plugin
            merkleTree = await createRecipientsMerkleTree(merkleTreeService, collection.address, [1, 2, 20]);
            plugin = await createPlugin(pluginRepository, { organization });
            // create collection plugin
            const input = {
                collectionId: collection.id,
                pluginId: plugin.id,
                name: 'collection plugin without merkle root',
                pluginDetail: {},
            };
            await collectionPluginService.createCollectionPlugin(input);
            await collectionPluginService.createCollectionPlugin({
                ...input,
                merkleRoot: merkleTree.merkleRoot,
                name: 'collection plugin with merkle root',
            });
        });

        it('should get metadata overview', async () => {
            const result = await service.getMetadataOverview({
                collectionId: collection.id,
            });

            expect(result.attributes.staticAttributes).toEqual(
                expect.arrayContaining([
                    {
                        key: 'BgColor',
                        name: 'BgColor',
                        type: 'string',
                        valueCounts: [
                            {
                                value: 'Green',
                                count: 21,
                            },
                        ],
                    },
                    {
                        key: 'Width',
                        name: 'Width',
                        type: 'number',
                        valueCounts: [
                            {
                                value: 30,
                                count: 21,
                            },
                        ],
                    },
                    {
                        key: 'Type',
                        name: 'Type',
                        type: 'string',
                        valueCounts: [
                            {
                                value: 'Golden',
                                count: 69,
                            },
                        ],
                    },
                ]),
            );

            expect(result.attributes.dynamicAttributes).toEqual([
                {
                    key: 'Color',
                    name: 'Color',
                    type: 'string',
                    class: 'upgradable',
                    valueCounts: [
                        {
                            value: 'Red',
                            count: 9,
                        },
                        {
                            value: 'Green',
                            count: 69,
                        },
                    ],
                },
                {
                    key: 'Height',
                    name: 'Height',
                    type: 'number',
                    class: 'upgradable',
                    valueCounts: [
                        {
                            value: 180,
                            count: 9,
                        },
                        {
                            value: 190,
                            count: 69,
                        },
                    ],
                    min: '180',
                    max: '190',
                },
            ]);
            expect(result.plugins).toEqual(
                expect.arrayContaining([
                    {
                        name: 'collection plugin without merkle root',
                        pluginName: plugin.name,
                        count: 99,
                    },
                    {
                        name: 'collection plugin with merkle root',
                        pluginName: plugin.name,
                        count: 3,
                    },
                ]),
            );
            expect(result.upgrades).toEqual(
                expect.arrayContaining([
                    {
                        name: '@vibe_lab/loyalty_points',
                        count: 78,
                    },
                    {
                        name: '@vibe_lab/magic_rule_engine',
                        count: 30,
                    },
                    {
                        name: '@vibe_lab/airdrop',
                        count: 99,
                    },
                ]),
            );

            const getBySlugResult = await service.getMetadataOverview({
                collectionSlug: collection.slug,
            });

            const getByAddressResult = await service.getMetadataOverview({
                collectionAddress: collection.address,
            });

            expect(getBySlugResult).toEqual(result);
            expect(getByAddressResult).toEqual(result);
        });
    });

    describe('createMigrationCollaboration', () => {
        it('should create collaboration for collection migration', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            const ownerAddress = faker.finance.ethereumAddress();
            const wallet = await walletService.createWallet({
                address: ownerAddress,
            });

            const collaboration = await service.createMigrationCollaboration(
                ownerAddress, wallet.id, organization.id, owner.id);

            expect(collaboration).toBeDefined();
            expect(collaboration.collaborators[0].address).toBe(ownerAddress);
            expect(collaboration.collaborators[0].rate).toBe(0);
            expect(collaboration.wallet.id).toBe(wallet.id);
            expect(collaboration.organization.id).toBe(organization.id);
        });
    });

    describe('createMigrationCollectionAndTier', function () {
        it('should create migration collection and tier', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

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
                owner: owner,
            });

            const ownerAddress = faker.finance.ethereumAddress();
            const wallet = await walletService.createWallet({
                address: ownerAddress,
            });

            const collaboration = await service.createMigrationCollaboration(
                ownerAddress, wallet.id, organization.id, owner.id);
            const contractMetadata: NftContract = {
                name: 'NewHere',
                symbol: 'NEWHERE',
                totalSupply: '3933',
                tokenType: 'ERC721',
                address: '0x4135063dc85190660ed08790f59bc711d8b404c0',
                contractDeployer: '0x2945e306b9d4f4e4f19ebb7b857a96866e9d8570',
                deployedBlockNumber: 15617752,
                openSea: {
                    floorPrice: 0.022989,
                    collectionName: 'WE\'RE NEW HERE',
                    collectionSlug: 'werenewhere',
                    safelistRequestStatus: 'approved',
                    imageUrl: 'https://i.seadn.io/gcs/files/d572530166749c4fa036b14375a35af2.jpg?w=500&auto=format',
                    description:
                        'WE\'RE NEW HERE Newbies are generative pixel NFTs that benefit the production of the I\'M NEW HERE film. \n\nEvery Newbie is created from a pool of 1100+ traits based on over 150 iconic artists, voices, and communities in the NFT space! They are made up of several handmade layers, each taken from a 1/1 in the collection.\n\nThe I\'M NEW HERE film is a documentary about Cryptoart, its history, and the community of artists, visionaries, and builders that has formed around it. It features an incredible cast of people that have made this space their home. \n\nFull list here: https://www.newhere.xyz/cast',
                    externalUrl: 'https://www.newhere.xyz/',
                    twitterUsername: 'newherexyz',
                    bannerImageUrl: 'https://i.seadn.io/gcs/files/36f6d3c3664870664ed1b819d92f06f0.png?w=500&auto=format',
                    lastIngestedAt: '2023-10-10T21:35:09.000Z',
                },
            } as any as NftContract;

            const collection = await service.createMigrationCollectionAndTier(
                contractMetadata, organization, wallet, collaboration);
            expect(collection).toBeDefined();
            expect(collection.name).toEqual(contractMetadata.name);
            expect(collection.kind).toEqual(CollectionKind.migration);
            expect(collection.address).toEqual(contractMetadata.address);
            expect(collection.tokenAddress).toEqual(contractMetadata.address);
            expect(collection.organization.id).toEqual(organization.id);
            expect(collection.collaboration.id).toEqual(collaboration.id);
            expect(collection.collaboration.collaborators[0].address).toEqual(ownerAddress);
            expect(collection.collaboration.collaborators[0].rate).toEqual(0);
        });
    });

    describe('createMintSaleContract', () => {
        it('should create mint sale contract', async () => {
            const contractMetadata: NftContract = {
                name: 'NewHere',
                symbol: 'NEWHERE',
                totalSupply: '3933',
                tokenType: 'ERC721',
                address: '0x4135063dc85190660ed08790f59bc711d8b404c0',
                contractDeployer: '0x2945e306b9d4f4e4f19ebb7b857a96866e9d8570',
                deployedBlockNumber: 15617752,
                openSea: {
                    floorPrice: 0.022989,
                    collectionName: 'WE\'RE NEW HERE',
                    collectionSlug: 'werenewhere',
                    safelistRequestStatus: 'approved',
                    imageUrl: 'https://i.seadn.io/gcs/files/d572530166749c4fa036b14375a35af2.jpg?w=500&auto=format',
                    description:
                        'WE\'RE NEW HERE Newbies are generative pixel NFTs that benefit the production of the I\'M NEW HERE film. \n\nEvery Newbie is created from a pool of 1100+ traits based on over 150 iconic artists, voices, and communities in the NFT space! They are made up of several handmade layers, each taken from a 1/1 in the collection.\n\nThe I\'M NEW HERE film is a documentary about Cryptoart, its history, and the community of artists, visionaries, and builders that has formed around it. It features an incredible cast of people that have made this space their home. \n\nFull list here: https://www.newhere.xyz/cast',
                    externalUrl: 'https://www.newhere.xyz/',
                    twitterUsername: 'newherexyz',
                    bannerImageUrl: 'https://i.seadn.io/gcs/files/36f6d3c3664870664ed1b819d92f06f0.png?w=500&auto=format',
                    lastIngestedAt: '2023-10-10T21:35:09.000Z',
                },
            } as any as NftContract;

            const contract = await service.createMintSaleContract(
                421613, contractMetadata, faker.string.uuid(), contractMetadata.contractDeployer);
            expect(contract).toBeDefined();
            expect(contract.address).toEqual(contractMetadata.address);
            expect(contract.chainId).toEqual(421613);
            expect(contract.height).toEqual(contractMetadata.deployedBlockNumber);
        });
    });

    describe('migrateCollection', () => {
        it('should throw if the user doesnt have a wallet with the same address as the collection owner', async () => {
            const chainId = 1;
            const tokenAddress = faker.finance.ethereumAddress();
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const organization = await createOrganization(organizationService, {
                owner: owner,
            });
            jest.spyOn(alchemyService as any, 'getContractOwner').mockResolvedValue('');

            await expect(async () => {
                await service.migrateCollection(chainId, tokenAddress, owner, organization);
            }).rejects.toThrow(new Error(`The collection is not owned by the user`));
        });

        it('should return the existing collection with the same tokenAddress', async () => {
            const chainId = 1;
            const tokenAddress = faker.finance.ethereumAddress();
            const address = faker.finance.ethereumAddress();
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            await walletService.createWallet({
                address,
                ownerId: owner.id,
            });
            const organization = await createOrganization(organizationService, {
                owner: owner,
            });

            const existingCollection = await createCollection2({
                tokenAddress,
            });

            jest.spyOn(alchemyService as any, 'getNFTCollectionMetadata').mockResolvedValue({
                contractDeployer: address,
            });
            jest.spyOn(alchemyService as any, 'getContractOwner').mockResolvedValue('');

            const result = await service.migrateCollection(chainId, tokenAddress, owner, organization);
            expect(result.id).toEqual(existingCollection.id);
        });
    });
});
