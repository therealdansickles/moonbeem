import { Coin } from 'src/sync-chain/coin/coin.dto';

import { faker } from '@faker-js/faker';

import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import {
    MintSaleTransactionService
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { TierService } from '../tier/tier.service';
import { PollerService } from './poller.service';

describe('PollerService', () => {
    let service: PollerService;
    let collectionService: CollectionService;
    let coinService: CoinService;
    let tierService: TierService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let coin: Coin;

    beforeAll(async () => {
        service = global.pollerService;
        collectionService = global.collectionService;
        tierService = global.tierService;
        mintSaleTransactionService = global.mintSaleTransactionService;
        coinService = global.coinService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getSaleRecord', () => {
        beforeEach(async () => {
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

        it('should return sale records for tier without attributes', async () => {
            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.tiered,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
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

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getSaleRecord();
            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThanOrEqual(1);
        });

        it('should return sale records for tier with attributes', async () => {
            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.tiered,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
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

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getSaleRecord();
            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThanOrEqual(1);
        });

        it('should return sale records for tier while removing empty display_type', async () => {
            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.tiered,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
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

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getSaleRecord();
            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThanOrEqual(1);

            const returnedRecord = result.find((r) => r.collection_id === collection.id);
            expect(returnedRecord.properties.level).toBeDefined();
            expect(returnedRecord.properties.level.value).toBeDefined();
        });
    });
});
