import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CoinMarketCapModule } from '../coinmarketcap/coinmarketcap.module';
import { CoinMarketCapService } from '../coinmarketcap/coinmarketcap.service';
import { Collection } from '../collection/collection.entity';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.entity';
import { CollectionPluginModule } from '../collectionPlugin/collectionPlugin.module';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { MerkleTree } from '../merkleTree/merkleTree.entity';
import { MerkleTreeModule } from '../merkleTree/merkleTree.module';
import { Plugin as PluginEntity } from '../plugin/plugin.entity';
import { PluginModule } from '../plugin/plugin.module';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { Wallet } from '../wallet/wallet.entity';
import { Nft } from './nft.entity';
import { NftResolver } from './nft.resolver';
import { NftService } from './nft.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Nft, Tier, Collection, PluginEntity, CollectionPlugin, MerkleTree, Wallet]),
        TypeOrmModule.forFeature([Asset721, Coin, MintSaleContract, MintSaleTransaction], 'sync_chain'),
        forwardRef(() => Asset721Module),
        forwardRef(() => PluginModule),
        forwardRef(() => MerkleTreeModule),
        forwardRef(() => CollectionPluginModule),
        forwardRef(() => TierModule),
        forwardRef(() => CoinModule),
        forwardRef(() => CoinMarketCapModule),
        HttpModule,
    ],
    exports: [NftModule],
    providers: [Asset721Service, CoinService, CoinMarketCapService, NftService, NftResolver, CollectionPluginService, TierService],
})
export class NftModule {}
