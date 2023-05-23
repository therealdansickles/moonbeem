import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

import { Tier } from './tier.entity';
import { TierModule } from './tier.module';
import { TierService } from './tier.service';
import { CollectionKind } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { Collection } from '../collection/collection.dto';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import BigNumber from 'bignumber.js';

describe('TierService', () => {
    let repository: Repository<Tier>;
    let service: TierService;
    let collection: Collection;
    let collectionService: CollectionService;
    let coinService: CoinService;
    let coin: Coin;
    let mintSaleTransactionService: MintSaleTransactionService;

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
                TierModule,
            ],
        }).compile();

        repository = module.get('TierRepository');
        service = module.get<TierService>(TierService);
        collectionService = module.get<CollectionService>(CollectionService);
        coinService = module.get<CoinService>(CoinService);
        mintSaleTransactionService = module.get<MintSaleTransactionService>(MintSaleTransactionService);

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
    });

    afterAll(async () => {
        global.gc && global.gc();
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

            const tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            expect(tier).toBeDefined();
            expect(tier.price).toEqual('100');
        });

        it('Should create a new tier for whitelisting collection', async () => {
            collection = await collectionService.createCollection({
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
            });
        });

        it('Should create a tier with attributes, conditions and plugins', async () => {
            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.whitelistEdition,
                address: faker.finance.ethereumAddress(),
            });

            const conditions = [
                {
                    trait_type: 'Ranking',
                    rules: {
                        trait_type: 'greater_than',
                        value: '10',
                    },
                    update: {
                        trait_type: 'Claimble',
                        value: 'true',
                    },
                },
            ];

            const plugins = [
                {
                    type: 'gitub',
                    path: 'vibexyz/vibes',
                },
                {
                    type: 'vibe',
                    path: 'points',
                },
            ];
            const attributes = [
                {
                    trait_type: 'Base',
                    value: 'Starfish',
                },
                {
                    trait_type: 'Eyes',
                    value: 'Big',
                },
            ];

            const tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                merkleRoot: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                paymentTokenAddress: coin.address,
                tierId: 0,
                conditions,
                plugins,
                attributes: attributes,
            });

            expect(tier).toBeDefined();
            expect(tier.conditions).toStrictEqual(conditions);
            expect(tier.attributes).toStrictEqual(attributes);
            expect(tier.plugins).toStrictEqual(plugins);
        });
    });

    describe('getTiersByCollection', () => {
        it('should get tiers based on collection id', async () => {
            collection = await collectionService.createCollection({
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
            });

            await service.createTier({
                name: faker.company.name(),
                totalMints: 200,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const result = await service.getTiersByCollection(collection.id);
            expect(result.length).toBe(2);

            const specificTier = result.find((tier) => tier.totalMints === 200);
            expect(specificTier).toBeDefined();
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

            const tier = await service.createTier({
                name: faker.company.name(),
                collection: { id: collection.id },
                totalMints: 10,
                paymentTokenAddress: coin.address,
                tierId: 0,
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

            const tier = await service.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            let result = await service.deleteTier(tier.id);

            expect(result).toBeTruthy();
        });
    });

    describe('getTierProfit', () => {
        it('should get back tier profits', async () => {
            collection = await collectionService.createCollection({
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

            let result = await service.getTierProfit(tier.id);

            const totalProfitInToken = new BigNumber(transaction.price)
                .plus(new BigNumber(transaction2.price))
                .div(new BigNumber(10).pow(coin.decimals))
                .toString();

            expect(result.inPaymentToken).toBe(totalProfitInToken);
            expect(result.inUSDC).toBe(new BigNumber(totalProfitInToken).multipliedBy(coin.derivedUSDC).toString());
        });
    });
});
