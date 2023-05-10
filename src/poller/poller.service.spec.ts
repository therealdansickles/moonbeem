import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollectionKind } from '../collection/collection.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
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

describe('PollerService', () => {
    let service: PollerService;
    let collectionService: CollectionService;
    let coinService: CoinService;
    let tierService: TierService;
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

    describe('#getSaleRecord', () => {
        beforeEach(async () => {
            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.tiered,
                address: faker.finance.ethereumAddress(),
            });

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

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const txn = await mintSaleTransactionService.createMintSaleTransaction({
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
        });

        it('should return sale records', async () => {
            const result = await service.getSaleRecord();
            expect(result).toBeDefined();
            expect(result.length).toBeGreaterThanOrEqual(1);
        });
    });
});
