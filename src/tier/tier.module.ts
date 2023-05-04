import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Tier } from './tier.entity';
import { TierService } from './tier.service';
import { TierResolver } from './tier.resolver';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collection, Tier]),
        TypeOrmModule.forFeature([Coin], 'sync_chain'),
        TypeOrmModule.forFeature([MintSaleContract], 'sync_chain'),
        TypeOrmModule.forFeature([MintSaleTransaction], 'sync_chain'),
        forwardRef(() => CollectionModule),
        forwardRef(() => CoinModule),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => MintSaleTransactionModule),
    ],
    exports: [TierModule],
    providers: [TierService, TierResolver],
})
export class TierModule {}
