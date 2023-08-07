import { startOfDay, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { ethers } from 'ethers';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { CollaborationService } from '../collaboration/collaboration.service';
import { OrganizationService } from '../organization/organization.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { CoinQuotes } from '../sync-chain/coin/coin.dto';
import { CoinService } from '../sync-chain/coin/coin.service';
import {
    MintSaleContractService
} from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import {
    MintSaleTransactionService
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { TierService } from '../tier/tier.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { CollectionStat, CollectionStatus } from './collection.dto';
import { Collection } from './collection.entity';
import { CollectionService } from './collection.service';

describe('CollectionService', () => {
    let repository: Repository<Collection>;
    let service: CollectionService;
    let coinService: CoinService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let mintSaleContractService: MintSaleContractService;
    let asset721Service: Asset721Service;
    let organizationService: OrganizationService;
    let tierService: TierService;
    let userService: UserService;
    let walletService: WalletService;
    let collaborationService: CollaborationService;

    beforeAll(async () => {
        repository = global.collectionRepository;
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
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

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
                        rate: parseInt(faker.string.numeric(2)),
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
                name: `${faker.company.name()}${faker.string.numeric(5)}`,
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
                name: `${faker.company.name()}${faker.string.numeric(5)}`,
                displayName: faker.company.name(),
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                publishedAt: faker.date.past(),
            });

            await repository.save({
                name: `${faker.company.name()}${faker.string.numeric(5)}`,
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
                name: `${faker.company.name()}${faker.string.numeric(5)}`,
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
                name: `${faker.company.name()}${faker.string.numeric(5)}`,
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
                name: `${faker.company.name()}${faker.string.numeric(5)}`,
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
                name: `${faker.company.name()}${faker.string.numeric(5)}`,
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
                name: `${faker.company.name()}${faker.string.numeric(5)}`,
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
                name: `${faker.company.name()}${faker.string.numeric(5)}`,
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
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

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

            await tierService.createTier({
                name: faker.company.name(),
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

            await tierService.createTier({
                name: faker.company.name(),
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
            expect(result[0].tiers[0].coin).toBeTruthy();
            expect(result[0].tiers[0].coin.symbol).toEqual(coin.symbol);
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

            await service.createCollection({
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

            const [result] = await service.getCreatedCollectionsByWalletId(wallet.id);

            expect(result).toBeDefined();
            expect(result.creator.id).toEqual(wallet.id);
            expect(result.organization.id).toEqual(organization.id);
        });
    });

    describe('precheckCollection', () => {
        it('should validate startDate and endDate', async () => {
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
                                totalMints: parseInt(faker.string.numeric(5)),
                            },
                        ],
                        organization: {
                            id: organization.id,
                        },
                        creator: { id: wallet.id },
                        startSaleAt: faker.date.future().getTime() / 1000,
                        endSaleAt: faker.date.past().getTime() / 1000,
                    })
            ).rejects.toThrow(`The endSaleAt should be greater than startSaleAt.`);
        });

        it('startDate should be greater than today', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
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
                                totalMints: parseInt(faker.string.numeric(5)),
                            },
                        ],
                        organization: {
                            id: organization.id,
                        },
                        creator: { id: wallet.id },
                        startSaleAt: faker.date.past().getTime() / 1000,
                    })
            ).rejects.toThrow(`The startSaleAt should be greater than today.`);
        });

        it('should pass if startDate or endDate is not provided', async () => {
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

            const result = await service.precheckCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: parseInt(faker.string.numeric(5)),
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
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
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

            const result = await service.precheckCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: parseInt(faker.string.numeric(5)),
                    },
                ],
                organization: {
                    id: organization.id,
                },
                creator: { id: wallet.id },
                startSaleAt: Math.floor(faker.date.future({ years: 1 }).getTime() / 1000),
                endSaleAt: Math.floor(faker.date.future({ years: 2 }).getTime() / 1000),
            });
            expect(result).toEqual(true);
        });
    });

    describe('createCollection', () => {
        it('should create a collection', async () => {
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

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: parseInt(faker.string.numeric(5)),
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
                        rate: parseInt(faker.string.numeric(2)),
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
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

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

            await tierService.createTier({
                name: faker.company.name(),
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

            const txn = await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: faker.string.numeric(19),
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const [result] = await service.getBuyers(collection.address);
            expect(result).toEqual(txn.recipient);
        });
    });

    describe('getCollectionByQuery', () => {
        it('should return tier info and the coin info contained in the tier', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

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
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

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
        const tokenId1 = faker.string.numeric(5);

        const owner2 = faker.finance.ethereumAddress().toLowerCase();
        const tokenId2 = faker.string.numeric(5);

        beforeEach(async () => {
            const beginTime = Math.floor(faker.date.recent().getTime() / 1000);

            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

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

            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: collectionAddress,
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: beginTime,
                endTime: beginTime + 86400,
                tierId: 0,
                price: faker.string.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: tokenAddress,
                collectionId: collection.id,
            });

            await asset721Service.createAsset721({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId1,
                owner: owner1,
            });
            await asset721Service.createAsset721({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId2,
                owner: owner2,
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 0,
                tokenAddress: tokenAddress,
                tokenId: tokenId1,
                price: '100',
                paymentToken: faker.finance.ethereumAddress(),
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 1,
                tokenAddress: tokenAddress,
                tokenId: tokenId2,
                price: '100',
                paymentToken: faker.finance.ethereumAddress(),
            });
        });

        it('should get holders', async () => {
            const tokenId3 = faker.string.numeric(5);

            // Total count won't include duplicates
            await asset721Service.createAsset721({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId3,
                owner: owner2,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 1,
                tokenAddress: tokenAddress,
                tokenId: tokenId3,
                price: '100',
                paymentToken: faker.finance.ethereumAddress(),
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
            expect(holder1.totalPrice).toBe(100);
            expect(holder1.address).toBe(owner1);

            const holder2 = result.edges.find((edge) => edge.node.address === owner2)?.node;
            expect(holder2.quantity).toBe(2);
            expect(holder2.price).toBe('100');
            expect(holder2.totalPrice).toBe(200);
            // Assert the owner shows even it can't be find in the wallet repo
            expect(holder2.address).toBe(owner2);
        });

        it('should get unique holders', async () => {
            const tokenId3 = faker.string.numeric(5);
            await asset721Service.createAsset721({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId3,
                owner: owner2,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 1,
                tokenAddress: tokenAddress,
                tokenId: tokenId3,
                price: '100',
                paymentToken: faker.finance.ethereumAddress(),
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
            const result = await service.getLandingPageCollections(CollectionStatus.active, 0, 10);
            expect(result).toBeDefined();
            expect(result.total).toEqual(1);
            expect(result.data).toBeDefined();
            expect(result.data.length).toEqual(1);
            expect(result.data[0].address).toEqual(collectionAddress);
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
            const price = faker.string.numeric(19);
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

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
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

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                address: collectionAddress,
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: faker.string.numeric(19),
                paymentToken,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: faker.string.numeric(19),
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

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                address: collectionAddress,
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
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

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: faker.string.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: faker.string.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getOwners(collection.address);
            expect(result).toBe(2);
        });
    });

    describe('getSevenDayVolume', () => {
        it('should be return 7day volume', async () => {
            const collectionAddress = faker.finance.ethereumAddress();

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                address: collectionAddress,
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: faker.string.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: faker.string.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const mockResponse = {
                inUSDC: '100',
                inPaymentToken: '100',
            };

            jest.spyOn(service, 'getSevenDayVolume').mockImplementation(async () => mockResponse);
            const result = await service.getSevenDayVolume(collectionAddress);

            expect(result).toBeDefined();
            expect(result.inUSDC).toBe('100');
        });
    });

    describe('getGrossEarnings', () => {
        it('should test gross earnings', async () => {
            const collectionAddress = faker.finance.ethereumAddress();

            await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                address: collectionAddress,
            });

            // should return 0
            const result = await service.getGrossEarnings(collectionAddress);
            expect(result).toBeDefined();
            expect(result.inPaymentToken).toBe('0');
            expect(result.inUSDC).toBe('0');

            const collectionAddress1 = faker.finance.ethereumAddress();
            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                address: collectionAddress1,
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: faker.string.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: faker.string.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const mockResponse = {
                inUSDC: '100',
                inPaymentToken: '100',
            };
            jest.spyOn(service, 'getGrossEarnings').mockImplementation(async () => mockResponse);
            const result1 = await service.getGrossEarnings(collectionAddress);
            expect(result1).toBeDefined();
            expect(result1.inUSDC).toBe('100');
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
                organization.id,
                startOfDay(new Date())
            );
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
                organization.id,
                startOfWeek(new Date())
            );
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
                organization.id,
                startOfMonth(new Date())
            );
            expect(result2).toBe(1);
        });
    });

    describe('getAggregatedCollectionActivities', () => {
        const collectionAddress = faker.finance.ethereumAddress().toLowerCase();
        const tokenAddress = faker.finance.ethereumAddress().toLowerCase();
        const walletAddress1 = faker.finance.ethereumAddress().toLowerCase();
        const walletAddress2 = faker.finance.ethereumAddress().toLowerCase();
        const txHash1 = faker.string.hexadecimal({ length: 66, casing: 'lower' });
        const txHash2 = faker.string.hexadecimal({ length: 66, casing: 'lower' });
        let collection;

        beforeEach(async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

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
                height: parseInt(faker.string.numeric(5)),
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
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
            };

            // minted 3 in one transaction
            const tokenId1 = faker.string.numeric(1);
            await mintSaleTransactionService.createMintSaleTransaction({
                tokenId: tokenId1,
                price: '1000000000000000000',
                ...transactionContent,
            });
            await asset721Service.createAsset721({
                tokenId: tokenId1,
                owner: walletAddress1,
                ...assetContent,
            });

            const tokenId2 = faker.string.numeric(2);
            await mintSaleTransactionService.createMintSaleTransaction({
                tokenId: tokenId2,
                price: '2000000000000000000',
                ...transactionContent,
            });
            await asset721Service.createAsset721({
                tokenId: tokenId2,
                owner: walletAddress1,
                ...assetContent,
            });

            const tokenId3 = faker.string.numeric(3);
            await mintSaleTransactionService.createMintSaleTransaction({
                tokenId: tokenId3,
                price: '3000000000000000000',
                ...transactionContent,
            });
            await asset721Service.createAsset721({
                tokenId: tokenId3,
                owner: walletAddress1,
                ...assetContent,
            });

            // another transaction
            const tokenId4 = faker.string.numeric(4);
            const anotherTransactionContent = Object.assign(transactionContent, {
                tokenId: tokenId4,
                price: '4000000000000000000',
                recipient: walletAddress2,
                height: parseInt(faker.string.numeric(5)),
                txHash: txHash2,
                txTime: Math.floor(new Date().getTime() / 1000),
            });
            await mintSaleTransactionService.createMintSaleTransaction(anotherTransactionContent);
            await asset721Service.createAsset721({
                tokenId: tokenId4,
                owner: walletAddress2,
                ...assetContent,
            });
        });

        it('should work', async () => {
            const result = await service.getAggregatedCollectionActivities(collectionAddress, tokenAddress);
            expect(result.total).toEqual(2);
            expect(result.data.length).toEqual(2);
            const aggregation1 = result.data.find((item) => item.txHash === txHash1);
            expect(aggregation1.tokenIds.length).toEqual(3);
            expect(aggregation1.tier.name).toEqual(collection.tiers[0].name);
            const aggregation2 = result.data.find((item) => item.txHash === txHash2);
            expect(aggregation2.tokenIds.length).toEqual(1);
        });
    });

    describe('getCollectionEarningsChart', () => {
        it('should return the earnings chart', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

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

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(new Date().valueOf() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
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
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

            const collection = await service.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                address: faker.finance.ethereumAddress(),
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: faker.number.int({ min: 10000, max: 99999 }),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: '1000000000000000000',
                paymentToken: coin.address,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: faker.number.int({ min: 10000, max: 99999 }),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric(3),
                price: '1000000000000000000',
                paymentToken: coin.address,
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
});
