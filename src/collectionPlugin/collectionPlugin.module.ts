import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collection } from '../collection/collection.entity';
import { MerkleTree } from '../merkleTree/merkleTree.entity';
import { Plugin } from '../plugin/plugin.entity';
import { Redeem } from '../redeem/redeem.entity';
import { RedeemModule } from '../redeem/redeem.module';
import { RedeemService } from '../redeem/redeem.service';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { CollectionPlugin } from './collectionPlugin.entity';
import { CollectionPluginResolver } from './collectionPlugin.resolver';
import { CollectionPluginService } from './collectionPlugin.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([CollectionPlugin, Plugin, Collection, Redeem, MerkleTree]),
        TypeOrmModule.forFeature([Asset721], 'sync_chain'),
        forwardRef(() => Asset721Module),
        forwardRef(() => RedeemModule),
    ],
    exports: [CollectionPluginModule],
    providers: [CollectionPluginService, CollectionPluginResolver, RedeemService, Asset721Service],
})
export class CollectionPluginModule {}
