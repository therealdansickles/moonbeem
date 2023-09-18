import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { History721 } from '../sync-chain/history721/history721.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { Wallet } from '../wallet/wallet.entity';
import { AlchemyController } from './alchemy.controller';
import { AlchemyService } from './alchemy.service';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([Collection, Tier, Wallet]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721, History721], 'sync_chain'),
        CollectionModule,
        CoinModule,
        MintSaleContractModule,
        TierModule,
    ],
    providers: [TierService, AlchemyService],
    controllers: [AlchemyController]
})
export class AlchemyModule {}
