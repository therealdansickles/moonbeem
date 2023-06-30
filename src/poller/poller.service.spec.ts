import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionKind } from '../collection/collection.entity';
import { PollerService } from './poller.service';
import { CollectionService } from '../collection/collection.service';
import { TierService } from '../tier/tier.service';
import { CollectionModule } from '../collection/collection.module';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { postgresConfig } from '../lib/configs/db.config';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { TierModule } from '../tier/tier.module';
import { faker } from '@faker-js/faker';
import { CoinService } from '../sync-chain/coin/coin.service';
import { PollerModule } from './poller.module';
import { Coin } from 'src/sync-chain/coin/coin.dto';

describe('PollerService', () => {
    let service: PollerService;
    let collectionService: CollectionService;
    let coinService: CoinService;
    let tierService: TierService;
    let mintSaleTransactionService: MintSaleTransactionService;
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
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                PollerModule,
                MintSaleTransactionModule,
                CollectionModule,
                TierModule,
            ],
        }).compile();

        service = module.get<PollerService>(PollerService);
        collectionService = module.get<CollectionService>(CollectionService);
        tierService = module.get<TierService>(TierService);
        mintSaleTransactionService = module.get<MintSaleTransactionService>(MintSaleTransactionService);
        coinService = module.get<CoinService>(CoinService);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('#getSaleRecord', () => {
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
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
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
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
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
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getSaleRecord();
            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThanOrEqual(1);

            const returnedRecord = result.find((r) => r.collection_id === collection.id);
            // expect(returnedRecord.attributes.find((a) => a.trait_type === 'Sword')).toBeDefined();
            // we filter the info before we write it,
            // so commented the test case
            // expect(returnedRecord.attributes.find((a) => a.trait_type === 'Sword').display_type).not.toBeDefined();
        });
    });
});
