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
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collection, Tier, Wallet]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721], 'sync_chain'),
        forwardRef(() => CollectionModule),
        forwardRef(() => WalletModule),
        // sync_chain modules
        forwardRef(() => CoinModule),
        forwardRef(() => Asset721Module),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => MintSaleTransactionModule),
    ],
    exports: [TierModule],
    providers: [TierService, TierResolver],
})
export class TierModule {}
