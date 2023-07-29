import BigNumber from 'bignumber.js';

import { faker } from '@faker-js/faker';

import { Collection } from '../collection/collection.dto';
import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
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
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
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

        it('Should create a new tier for whitelisting collection', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.whitelistEdition,
                address: faker.finance.ethereumAddress(),
            });

            await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                merkleRoot: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
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

        it('Should create a tier with attributes, conditions and plugins', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.whitelistEdition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                merkleRoot: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
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

    describe('getTiersByQuery', () => {
        it('should return null if none query provided', async () => {
            const tiers = await service.getTiersByQuery({});
            expect(tiers).toBeNull();
        });

        it('should get tiers based on collection id', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
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

            await service.createTier({
                name: faker.company.name(),
                totalMints: 200,
                collection: { id: collection.id },
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

            const result = await service.getTiersByQuery({ collection: { id: collection.id } });
            expect(result.length).toBe(2);

            const specificTier = result.find((tier) => tier.totalMints === 200);
            expect(specificTier).toBeDefined();
        });

        it('should get tiers based on tier name', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const _tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
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

            const anotherTier = await service.createTier({
                name: faker.company.name(),
                totalMints: 200,
                collection: { id: collection.id },
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

            const result = await service.getTiersByQuery({ name: anotherTier.name });
            expect(result.length).toBe(1);

            const specificTier = result.find((tier) => tier.totalMints === 200);
            expect(specificTier).toBeDefined();
        });
    });

    describe('updateTier', () => {
        it('should update a tier', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await service.createTier({
                name: faker.company.name(),
                collection: { id: collection.id },
                totalMints: 10,
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

            const result = await service.updateTier(tier.id, {
                name: 'New name',
            });

            expect(result).toBeTruthy();
        });
    });

    describe('deleteTier', () => {
        it('should delete a tier', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
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

            const result = await service.deleteTier(tier.id);

            expect(result).toBeTruthy();
        });
    });

    describe('getTierProfit', () => {
        it('should get back tier profits', async () => {
            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
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

            const transaction = await mintSaleTransactionService.createMintSaleTransaction({
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
                paymentToken: coin.address,
            });

            const transaction2 = await mintSaleTransactionService.createMintSaleTransaction({
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
        const tierName = 'Test Tier';
        let tier: Tier;
        let draftTier: Tier;
        let innerCollection: Collection;
        let draftCollection: Collection;
        let coin;

        beforeEach(async () => {
            const tokenAddress = faker.finance.ethereumAddress().toLowerCase();
            coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1.5,
                enabled: true,
                chainId: 1,
            });

            innerCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: collectionAddress,
                tokenAddress: tokenAddress,
            });

            draftCollection =  await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The draft collection',
                about: 'The draft collection',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: null,
            });

            tier = await service.createTier({
                name: tierName,
                totalMints: 100,
                collection: { id: innerCollection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
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
                                    every: +faker.random.numeric(1),
                                    unit: 'minute',
                                },
                            },
                        ],
                    },
                },
            });

            tier = await service.createTier({
                name: faker.finance.accountName(),
                totalMints: 100,
                collection: { id: innerCollection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
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

            draftTier = await service.createTier({
                name: faker.finance.accountName(),
                totalMints: 100,
                collection: { id: draftCollection.id },
                paymentTokenAddress: coin.address,
                tierId: 100,
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


            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: collectionAddress,
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: tokenAddress,
                collectionId: innerCollection.id,
            });
            const owner1 = faker.finance.ethereumAddress().toLowerCase();
            await walletService.createWallet({ address: owner1 });
            const tokenId1 = faker.random.numeric(5);

            const owner2 = faker.finance.ethereumAddress().toLowerCase();
            await walletService.createWallet({ address: owner2 });
            const tokenId2 = faker.random.numeric(5);
            const tokenId3 = faker.random.numeric(5);

            await asset721Service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId1,
                owner: owner1,
            });
            await asset721Service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId2,
                owner: owner2,
            });
            await asset721Service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: tokenAddress,
                tokenId: tokenId3,
                owner: owner2,
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: owner1,
                address: collectionAddress,
                tierId: 0,
                tokenAddress: tokenAddress,
                tokenId: tokenId1,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: owner2,
                address: collectionAddress,
                tierId: 0,
                tokenAddress: tokenAddress,
                tokenId: tokenId2,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: owner2,
                address: collectionAddress,
                tierId: 0,
                tokenAddress: tokenAddress,
                tokenId: tokenId3,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });
        });

        it('should get 0 holders of draft collection tier', async () => {
            const tierHolders = await service.getHolders(draftTier.id, '', '',10, 10);
            expect(tierHolders.totalCount).toEqual(0);
        });

        it('should get aggregated holders of tier', async () => {
            const tierHolders = await service.getHolders(tier.id, '', '',10, 10);
            expect(tierHolders.totalCount).toEqual(2);
            expect(tierHolders.edges.length).toEqual(2);
            // We are not ordering by quantity, so we can't expect the order
            expect(tierHolders.edges[0].node.quantity + tierHolders.edges[1].node.quantity).toEqual(3);
        });

        it('should not include other collection holders', async () => {
            const anotherCollectionAddress = faker.finance.ethereumAddress().toLowerCase();
            const anotherTokenAddress = faker.finance.ethereumAddress().toLowerCase();
            const tokenId = faker.random.numeric(5);
            const tokenId2 = faker.random.numeric(4);
            const owner = faker.finance.ethereumAddress().toLowerCase();
            const owner2 = faker.finance.ethereumAddress().toLowerCase();
            const anotherCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                tokenAddress: anotherTokenAddress,
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: anotherCollectionAddress
            });
            await service.createTier({
                name: tierName,
                totalMints: 100,
                collection: { id: anotherCollection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
                metadata: {}
            });

            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: anotherCollectionAddress,
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: anotherTokenAddress,
                collectionId: anotherCollection.id,
            });

            await asset721Service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: anotherTokenAddress,
                tokenId: tokenId,
                owner: owner,
            });

            await asset721Service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: anotherTokenAddress,
                tokenId: tokenId2,
                owner: owner2,
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: owner,
                address: anotherCollectionAddress,
                tierId: 0,
                tokenAddress: anotherTokenAddress,
                tokenId: tokenId,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const tierHolders = await service.getHolders(tier.id, '', '',10, 10);
            expect(tierHolders.totalCount).toEqual(2);
            expect(tierHolders.edges.length).toEqual(2);
            expect(tierHolders.edges[0].node.quantity + tierHolders.edges[1].node.quantity).toEqual(3);
        });

        it('should get attribute overview', async () => {
            const result = await service.getArrtibutesOverview(collectionAddress.toLowerCase());
            expect(result).toBeDefined();
            expect(result.attributes).toBeDefined();
            expect(result.attributes['level']).toBeDefined();
            expect(result.attributes['level']['basic']).toEqual(1);

            expect(result.upgrades).toBeDefined();
            expect(result.upgrades['level']).toEqual(1);

            expect(result.plugins).toBeDefined();
            expect(result.plugins['vibexyz/creator_scoring']).toEqual(1);
        });

        it('should search by keyword', async () => {
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

        it('should search by properties', async () => {
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

        it('should search by plugin', async () => {
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

        it('should search by upgrade attrtibute', async () => {
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

        it('should search two tier, if input two attributes', async () => {
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
