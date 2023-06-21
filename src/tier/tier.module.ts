import { forwardRef, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import {
    MintSaleTransaction
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import {
    MintSaleTransactionModule
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { UserModule } from '../user/user.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Tier } from './tier.entity';
import { TierResolver } from './tier.resolver';
import { TierService } from './tier.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collection, Tier, Wallet]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721], 'sync_chain'),
        forwardRef(() => CollectionModule),
        forwardRef(() => WalletModule),
        forwardRef(() => UserModule),
        // sync_chain modules
        forwardRef(() => CoinModule),
        forwardRef(() => Asset721Module),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => MintSaleTransactionModule),
        JwtModule
    ],
    exports: [TierModule],
    providers: [JwtService, TierService, TierResolver],
})
export class TierModule {}
