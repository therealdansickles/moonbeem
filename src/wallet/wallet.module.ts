import { forwardRef, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtModule } from '@nestjs/jwt/dist/jwt.module';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Relationship } from '../relationship/relationship.entity';
import { RelationshipModule } from '../relationship/relationship.module';
import { RelationshipService } from '../relationship/relationship.service';
import { SessionModule } from '../session/session.module';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinModule } from '../sync-chain/coin/coin.module';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { Plugin } from '../plugin/plugin.entity';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Wallet } from './wallet.entity';
import { WalletResolver } from './wallet.resolver';
import { WalletService } from './wallet.service';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.entity';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { CollectionPluginModule } from '../collectionPlugin/collectionPlugin.module';
import { MerkleTree } from '../merkleTree/merkleTree.entity';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature(
            [Wallet, Relationship, User, Collaboration, Collection, Tier, CollectionPlugin, Plugin, MerkleTree]),
        TypeOrmModule.forFeature([MintSaleTransaction, MintSaleContract, Coin, Asset721], 'sync_chain'),
        forwardRef(() => SessionModule),
        forwardRef(() => CollaborationModule),
        forwardRef(() => CollectionModule),
        forwardRef(() => MintSaleTransactionModule),
        forwardRef(() => RelationshipModule),
        forwardRef(() => TierModule),
        forwardRef(() => UserModule),
        forwardRef(() => CoinModule),
        forwardRef(() => Asset721Module),
        forwardRef(() => CollectionPluginModule),
        JwtModule,
    ],
    exports: [WalletModule, WalletService],
    providers: [JwtService, RelationshipService, WalletService, WalletResolver, CollectionPluginService, Asset721Service],
    controllers: [],
})
export class WalletModule {
}
