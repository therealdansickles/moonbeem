import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AlchemyModule } from '../alchemy/alchemy.module';
import { AlchemyService } from '../alchemy/alchemy.service';
import { CoinMarketCapModule } from '../coinmarketcap/coinmarketcap.module';
import { CoinMarketCapService } from '../coinmarketcap/coinmarketcap.service';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { Nft } from '../nft/nft.entity';
import { NftModule } from '../nft/nft.module';
import { NftService } from '../nft/nft.service';
import { OpenseaModule } from '../opensea/opensea.module';
import { OpenseaService } from '../opensea/opensea.service';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { CoinService } from '../sync-chain/coin/coin.service';
import { History721 } from '../sync-chain/history721/history721.entity';
import { History721Module } from '../sync-chain/history721/history721.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { Wallet } from '../wallet/wallet.entity';
import { Plugin } from './plugin.entity';
import { PluginResolver } from './plugin.resolver';
import { PluginService } from './plugin.service';
import { MerkleTree } from '../merkleTree/merkleTree.entity';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { CollectionPluginModule } from '../collectionPlugin/collectionPlugin.module';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plugin, Collection, Tier, Nft, Wallet, Collection, MerkleTree, CollectionPlugin]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721, History721], 'sync_chain'),
        forwardRef(() => CollectionModule),
        forwardRef(() => TierModule),
        forwardRef(() => OpenseaModule),
        forwardRef(() => CoinMarketCapModule),
        forwardRef(() => CoinModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => History721Module),
        forwardRef(() => NftModule),
        forwardRef(() => Asset721Module),
        forwardRef(() => CollectionPluginModule),
        forwardRef(() => AlchemyModule),
        HttpModule,
        JwtModule,
        ConfigModule,
    ],
    providers: [
        PluginService,
        PluginResolver,
        TierService,
        CollectionService,
        CoinService,
        OpenseaService,
        CoinMarketCapService,
        MintSaleTransactionService,
        JwtService,
        Asset721Service,
        NftService,
        AlchemyService,
        CollectionPluginService,
    ],
})
export class PluginModule {}
