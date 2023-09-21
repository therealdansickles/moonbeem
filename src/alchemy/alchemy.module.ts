import { HttpModule } from '@nestjs/axios';
import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { Nft } from '../nft/nft.entity';
import { NftModule } from '../nft/nft.module';
import { NftService } from '../nft/nft.service';
import { OpenseaModule } from '../opensea/opensea.module';
import { OpenseaService } from '../opensea/opensea.service';
import { Plugin } from '../plugin/plugin.entity';
import { PluginModule } from '../plugin/plugin.module';
import { PluginService } from '../plugin/plugin.service';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { History721 } from '../sync-chain/history721/history721.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { Wallet } from '../wallet/wallet.entity';
import { AlchemyController } from './alchemy.controller';
import { AlchemyService } from './alchemy.service';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.entity';
import { MerkleTree } from '../merkleTree/merkleTree.entity';
import { CollectionPluginModule } from '../collectionPlugin/collectionPlugin.module';
import { MerkleTreeModule } from '../merkleTree/merkleTree.module';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { MerkleTreeService } from '../merkleTree/merkleTree.service';

@Module({
    imports: [
        ConfigModule,
        TypeOrmModule.forFeature([Collection, Tier, Nft, Wallet, Plugin, CollectionPlugin, MerkleTree]),
        TypeOrmModule.forFeature([Coin, MintSaleContract, MintSaleTransaction, Asset721, History721], 'sync_chain'),
        forwardRef(() => CollectionModule),
        forwardRef(() => CoinModule),
        forwardRef(() => MintSaleContractModule),
        forwardRef(() => TierModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => OpenseaModule),
        forwardRef(() => NftModule),
        forwardRef(() => Asset721Module),
        forwardRef(() => PluginModule),
        forwardRef(() => CollectionPluginModule),
        forwardRef(() => MerkleTreeModule),
        HttpModule,
    ],
    providers: [
        TierService,
        CollectionService,
        MintSaleTransactionService,
        OpenseaService,
        NftService,
        Asset721Service,
        PluginService,
        AlchemyService,
        CollectionPluginService,
        MerkleTreeService,
    ],
    controllers: [AlchemyController],
})
export class AlchemyModule {}
