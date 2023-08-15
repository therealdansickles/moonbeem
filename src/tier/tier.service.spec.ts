import BigNumber from 'bignumber.js';

import { faker } from '@faker-js/faker';

import { Collection } from '../collection/collection.dto';
import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import {
    MintSaleContractService
} from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import {
    MintSaleTransactionService
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import {
    createAsset721, createCoin, createCollection, createMintSaleContract, createMintSaleTransaction,
    createTier
} from '../test-utils';
import { WalletService } from '../wallet/wallet.service';
import { Tier } from './tier.dto';
import { TierService } from './tier.service';

describe('TierService', () => {
    let service: TierService;
    let walletService: WalletService;
    let collectionService: CollectionService;

    let coinService: CoinService;
    let asset721Service: Asset721Service;
    let mintSaleContractService: MintSaleContractService;
    let mintSaleTransactionService: MintSaleTransactionService;

    beforeAll(async () => {
        service = global.tierService;
        walletService = global.walletService;
        collectionService = global.collectionService;
        coinService = global.coinService;
        asset721Service = global.asset721Service;
        mintSaleTransactionService = global.mintSaleTransactionService;
        mintSaleContractService = global.mintSaleContractService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('createTier', () => {
        it('should create a new tier', async () => {
            const coin = await createCoin(coinService);
            const collection = await createCollection(collectionService);

            const tier = await service.createTier({
                collection: { id: collection.id },
                name: faker.company.name(),
                totalMints: 100,
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
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

            expect(tier).toBeDefined();
            expect(tier.price).toEqual('100');
        });

        it('should create a new tier for whitelisting collection', async () => {
            const coin = await createCoin(coinService);

            const collection = await createCollection(collectionService, {
                kind: CollectionKind.whitelistEdition,
            });

            await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                merkleRoot: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
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
        });

        it('should create a tier with empty metadata', async () => {
            const coin = await createCoin(coinService);
            const collection = await createCollection(collectionService);

            const tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                merkleRoot: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            expect(tier.metadata.uses).toEqual([]);
            expect(tier.metadata.properties).toEqual({});
            expect(tier.metadata.conditions).toEqual({});
        });

        it('should create a tier with attributes, conditions and plugins', async () => {
            const coin = await createCoin(coinService);
            const collection = await createCollection(collectionService);

            const tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                merkleRoot: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {
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

            expect(tier).toBeDefined();
        });
    });

    describe('getTiers', () => {
        it('should return null if none query provided', async () => {
            const tiers = await service.getTiers({});
            expect(tiers).toBeNull();
        });

        it('should get tiers based on collection id', async () => {
            const coin = await createCoin(coinService);
            const collection = await createCollection(collectionService);
            const anotherCollection = await createCollection(collectionService);

            await createTier(service, {
                collection: { id: anotherCollection.id },
                paymentTokenAddress: coin.address,
            });

            await createTier(service, {
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });

            const result = await service.getTiers({ collection: { id: collection.id } });
            expect(result.length).toBe(1);

            const specificTier = result.find((tier) => tier.totalMints === 200);
            expect(specificTier).toBeDefined();
        });

        it('should get tiers based on tier name', async () => {
            const coin = await createCoin(coinService);
            const collection = await createCollection(collectionService);

            await createTier(service, {
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });

            const anotherTier = await createTier(service, {
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });

            const result = await service.getTiers({ name: anotherTier.name });
            expect(result.length).toBe(1);

            const specificTier = result.find((tier) => tier.totalMints === 200);
            expect(specificTier).toBeDefined();
        });

        it('should get tiers based on tier metadata plugin', async () => {
            const coin = await createCoin(coinService);
            const collection = await createCollection(collectionService);
            
            const tierName = faker.commerce.productName();
            const pluginName1 = faker.lorem.word();
            const pluginName2 = faker.lorem.word();

            await createTier(service, {
                name: tierName,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                metadata: {
                    uses: [ pluginName1 ]
                },
            });

            await createTier(service, {
                name: faker.commerce.productName(),
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                metadata: {
                    uses: [ pluginName1, pluginName2 ]
                },
            });

            const result1 = await service.getTiers({ pluginName: pluginName1 });
            const result2 = await service.getTiers({ pluginName: pluginName2 });

            expect(result1.length).toEqual(2);
            expect(result2.length).toEqual(1);

            // let's try to combine some conditions
            const result3 = await service.getTiers({ pluginName: pluginName1, name: tierName });
            expect(result3.length).toEqual(1);
        });
    });

    describe('updateTier', () => {
        it('should update a tier', async () => {
            const coin = await createCoin(coinService);
            const collection = await createCollection(collectionService);

            const tier = await createTier(service, {
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });

            const result = await service.updateTier(tier.id, {
                name: 'New name',
            });

            expect(result).toBeTruthy();
        });
    });

    describe('deleteTier', () => {
        it('should delete a tier', async () => {
            const coin = await createCoin(coinService);
            const collection = await createCollection(collectionService);

            const tier = await createTier(service, {
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });
            const result = await service.deleteTier(tier.id);

            expect(result).toBeTruthy();
        });
    });

    describe('getTierProfit', () => {
        it('should get back tier profits', async () => {
            const coin = await createCoin(coinService);
            const collection = await createCollection(collectionService);

            const tier = await createTier(service, {
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
            });

            const transaction = await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                collectionId: collection.id,
                paymentToken: coin.address,
            });

            const transaction2 = await createMintSaleTransaction(mintSaleTransactionService, {
                address: collection.address,
                collectionId: collection.id,
                paymentToken: coin.address,
            });

            const result = await service.getTierProfit(tier.id);

            const totalProfitInToken = new BigNumber(transaction.price)
                .plus(new BigNumber(transaction2.price))
                .div(new BigNumber(10).pow(coin.decimals))
                .toString();

            expect(result.inPaymentToken).toBe(totalProfitInToken);
            expect(result.inUSDC).toBe(new BigNumber(totalProfitInToken).multipliedBy(coin.derivedUSDC).toString());
        });
    });

    describe('getHoldersOfTier', () => {
        const collectionAddress = faker.finance.ethereumAddress().toLowerCase();
        const tokenAddress = faker.finance.ethereumAddress().toLowerCase();
        const tierName = 'Test Tier';
        let tier: Tier;
        let draftTier: Tier;
        let innerCollection: Collection;
        let draftCollection: Collection;
        let coin;

        beforeEach(async () => {
            coin = await createCoin(coinService);
            innerCollection = await createCollection(collectionService, {
                address: collectionAddress,
                tokenAddress: tokenAddress,
            });

            draftCollection = await createCollection(collectionService, {
                displayName: 'The draft collection',
                about: 'The draft collection',
                address: null,
            });

            tier = await createTier(service, {
                name: tierName,
                collection: { id: innerCollection.id },
                paymentTokenAddress: coin.address,
                metadata: {
                    uses: ['vibexyz/creator_scoring', 'vibexyz/royalty_level'],
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
                    conditions: {
                        operator: 'and',
                        rules: [
                            {
                                rule: 'greater_than',
                                value: -1,
                                update: [{ value: '1', property: 'holding_days' }],
                                property: 'holding_days',
                            },
                            {
                                rule: 'greater_than',
                                value: 10,
                                update: [{ value: 'Bronze', property: 'level' }],
                                property: 'holding_days',
                            },
                        ],
                        trigger: [
                            {
                                type: 'schedule',
                                updatedAt: faker.date.past().toISOString(),
                                config: {
                                    startAt: faker.date.past().toISOString(),
                                    endAt: faker.date.future().toISOString(),
                                    every: +faker.string.numeric({ length: 1, allowLeadingZeros: false }),
                                    unit: 'minute',
                                },
                            },
                        ],
                    },
                },
            });

            tier = await createTier(service, {
                collection: { id: innerCollection.id },
                paymentTokenAddress: coin.address,
                metadata: {
                    uses: [],
                    properties: {
                        color: {
                            name: 'color',
                            type: 'string',
                            value: 'red',
                            display_value: 'Red',
                        },
                    },
                },
            });

            draftTier = await createTier(service, {
                collection: { id: draftCollection.id },
                paymentTokenAddress: coin.address,
            });

            await createMintSaleContract(mintSaleContractService, {
                address: collectionAddress,
                tokenAddress: tokenAddress,
                collectionId: innerCollection.id,
            });

            const owner1 = faker.finance.ethereumAddress().toLowerCase();
            await walletService.createWallet({ address: owner1 });
            const tokenId1 = faker.string.numeric({ length: 5, allowLeadingZeros: false });

            const owner2 = faker.finance.ethereumAddress().toLowerCase();
            await walletService.createWallet({ address: owner2 });
            const tokenId2 = faker.string.numeric({ length: 5, allowLeadingZeros: false });
            const tokenId3 = faker.string.numeric({ length: 5, allowLeadingZeros: false });

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
            await createAsset721(asset721Service, {
                address: tokenAddress,
                tokenId: tokenId3,
                owner: owner2,
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                recipient: owner1,
                address: collectionAddress,
                tokenAddress: tokenAddress,
                tokenId: tokenId1,
            });
            await createMintSaleTransaction(mintSaleTransactionService, {
                recipient: owner2,
                address: collectionAddress,
                tokenAddress: tokenAddress,
                tokenId: tokenId2,
            });
            await createMintSaleTransaction(mintSaleTransactionService, {
                recipient: owner2,
                address: collectionAddress,
                tokenAddress: tokenAddress,
                tokenId: tokenId3,
            });
        });

        it('should get 0 holders of draft collection tier', async () => {
            const tierHolders = await service.getHolders(draftTier.id, '', '', 10, 10);
            expect(tierHolders.totalCount).toEqual(0);
        });

        it('should get aggregated holders of tier', async () => {
            const tierHolders = await service.getHolders(tier.id, '', '', 10, 10);
            expect(tierHolders.totalCount).toEqual(2);
            expect(tierHolders.edges.length).toEqual(2);
            // We are not ordering by quantity, so we can't expect the order
            expect(tierHolders.edges[0].node.quantity + tierHolders.edges[1].node.quantity).toEqual(3);
        });

        it('should not include other collection holders', async () => {
            const anotherCollectionAddress = faker.finance.ethereumAddress().toLowerCase();
            const anotherTokenAddress = faker.finance.ethereumAddress().toLowerCase();
            const tokenId = faker.string.numeric({ length: 5, allowLeadingZeros: false });
            const tokenId2 = faker.string.numeric({ length: 4, allowLeadingZeros: false });
            const owner = faker.finance.ethereumAddress().toLowerCase();
            const owner2 = faker.finance.ethereumAddress().toLowerCase();
            const anotherCollection = await createCollection(collectionService, {
                tokenAddress: anotherTokenAddress,
                address: anotherCollectionAddress,
            });
            await createTier(service, {
                name: tierName,
                tierId: 0,
                collection: { id: anotherCollection.id },
                paymentTokenAddress: coin.address,
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                address: anotherCollectionAddress,
                tokenAddress: anotherTokenAddress,
                collectionId: anotherCollection.id,
            });

            await createAsset721(asset721Service, {
                address: anotherTokenAddress,
                tokenId: tokenId,
                owner: owner,
            });

            await createAsset721(asset721Service, {
                address: anotherTokenAddress,
                tokenId: tokenId2,
                owner: owner2,
            });

            await createMintSaleTransaction(mintSaleTransactionService, {
                recipient: owner,
                address: anotherCollectionAddress,
                tokenAddress: anotherTokenAddress,
                tokenId: tokenId,
            });

            const tierHolders = await service.getHolders(tier.id, '', '', 10, 10);
            expect(tierHolders.totalCount).toEqual(2);
            expect(tierHolders.edges.length).toEqual(2);
            expect(tierHolders.edges[0].node.quantity + tierHolders.edges[1].node.quantity).toEqual(3);
            expect(tierHolders.edges[0].node.address).toBeDefined();
            expect(tierHolders.edges[1].node.address).toBeDefined();
        });

        it('should get aggregated holders of tier with pagination', async () => {
            const firstTokenId = faker.number.int({ min: 10000, max: 99999 });
            const createAt = faker.date.past().toISOString();
            const txTime = Math.floor(faker.date.past().getTime()/1000);
            for (let i = 0; i < 14; i++) {
                const tokenId = firstTokenId + i;
                const owner = faker.finance.ethereumAddress();
                await walletService.createWallet({ address: owner });
                await createAsset721(asset721Service, {
                    address: tokenAddress,
                    tokenId,
                    owner,
                    txTime,
                });
                await createMintSaleTransaction(mintSaleTransactionService, {
                    recipient: owner,
                    address: collectionAddress,
                    tokenAddress,
                    tokenId,
                    createAt,
                });
            }
            const all = await service.getHolders(tier.id, '', '', 20, 0);
            // just created 14, and 2 more holders from the beforeAll block
            expect(all.totalCount).toEqual(16);
            expect(all.edges.length).toEqual(16);

            const firstPage = await service.getHolders(tier.id, '', '', 10, 0);
            expect(firstPage.totalCount).toEqual(16);
            expect(firstPage.edges.length).toEqual(10);

            const secondPage = await service.getHolders(tier.id, '', firstPage.pageInfo.endCursor, 10, 0);
            expect(secondPage.edges.length).toEqual(6);
            expect(secondPage.pageInfo.startCursor).not.toEqual(firstPage.pageInfo.endCursor);
            expect(secondPage.pageInfo.endCursor).toEqual(all.pageInfo.endCursor);

            const previousPage = await service.getHolders(tier.id, secondPage.pageInfo.startCursor, '', 0, 10);
            expect(previousPage.edges.length).toEqual(10);
            expect(previousPage.pageInfo.endCursor).toEqual(firstPage.pageInfo.startCursor);
        });

        it('should get attribute overview by collection address', async () => {
            const result = await service.getAttributesOverview({ collectionAddress } );
            expect(result).toBeDefined();
            expect(result.attributes).toBeDefined();
            expect(result.attributes['level']).toBeDefined();
            expect(result.attributes['level']['basic']).toEqual(1);

            expect(result.upgrades).toBeDefined();
            expect(result.upgrades['level']).toEqual(1);

            expect(result.plugins).toBeDefined();
            expect(result.plugins['vibexyz/creator_scoring']).toEqual(1);
        });

        xit('should get attribute overview by collection slug', async () => {
            const result = await service.getAttributesOverview({ collectionSlug: innerCollection.slug } );
            expect(result).toBeDefined();
            expect(result.attributes).toBeDefined();
            expect(result.attributes['level']).toBeDefined();
            expect(result.attributes['level']['basic']).toEqual(1);

            expect(result.upgrades).toBeDefined();
            expect(result.upgrades['level']).toEqual(1);

            expect(result.plugins).toBeDefined();
            expect(result.plugins['vibexyz/creator_scoring']).toEqual(1);
        });

        xit('should search by keyword and collection id', async () => {
            const result = await service.searchTier(
                { collectionId: innerCollection.id, keyword: 'test' },
                '',
                '',
                10,
                10
            );
            expect(result).toBeDefined();
            expect(result.totalCount).toEqual(1);
            expect(result.edges).toBeDefined();
            expect(result.edges[0]).toBeDefined();
            expect(result.edges[0].node).toBeDefined();
            expect(result.edges[0].node.name).toBe(tierName);
        });

        it('should search by keyword and collection slug', async () => {
            const result = await service.searchTier(
                { collectionSlug: innerCollection.slug, keyword: 'test' },
                '',
                '',
                10,
                10
            );
            expect(result).toBeDefined();
            expect(result.totalCount).toEqual(1);
            expect(result.edges).toBeDefined();
            expect(result.edges[0]).toBeDefined();
            expect(result.edges[0].node).toBeDefined();
            expect(result.edges[0].node.name).toBe(tierName);
        });

        xit('should search by properties', async () => {
            const result = await service.searchTier(
                { collectionId: innerCollection.id, properties: [{ name: 'holding_days', value: 125 }] },
                '',
                '',
                10,
                10
            );
            expect(result).toBeDefined();
            expect(result.totalCount).toEqual(1);
            expect(result.edges).toBeDefined();
            expect(result.edges[0]).toBeDefined();
            expect(result.edges[0].node).toBeDefined();
            expect(result.edges[0].node.name).toBe(tierName);
        });

        xit('should search by plugin', async () => {
            const result = await service.searchTier(
                { collectionId: innerCollection.id, plugins: ['vibexyz/creator_scoring'] },
                '',
                '',
                10,
                10
            );
            expect(result).toBeDefined();
            expect(result.totalCount).toEqual(1);
            expect(result.edges).toBeDefined();
            expect(result.edges[0]).toBeDefined();
            expect(result.edges[0].node).toBeDefined();
            expect(result.edges[0].node.name).toBe(tierName);
        });

        xit('should search by upgrade attribute', async () => {
            const result = await service.searchTier(
                { collectionId: innerCollection.id, upgrades: ['holding_days'] },
                '',
                '',
                10,
                10
            );
            expect(result).toBeDefined();
            expect(result.totalCount).toEqual(1);
            expect(result.edges).toBeDefined();
            expect(result.edges[0]).toBeDefined();
            expect(result.edges[0].node).toBeDefined();
            expect(result.edges[0].node.name).toBe(tierName);
        });

        xit('should search two tier, if input two attributes', async () => {
            const result = await service.searchTier(
                {
                    collectionId: innerCollection.id,
                    properties: [
                        { name: 'holding_days', value: 125 },
                        { name: 'color', value: 'red' },
                    ],
                },
                '',
                '',
                10,
                10
            );
            expect(result).toBeDefined();
            expect(result.totalCount).toEqual(2);
            expect(result.edges.length).toBe(2);
        });
    });
});
