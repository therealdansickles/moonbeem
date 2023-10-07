import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collection } from '../collection/collection.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Tier } from '../tier/tier.entity';
import { Nft } from './nft.entity';
import { NftResolver } from './nft.resolver';
import { NftService } from './nft.service';
import { CollectionPluginModule } from '../collectionPlugin/collectionPlugin.module';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { Plugin as PluginEntity } from '../plugin/plugin.entity';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.entity';
import { MerkleTree } from '../merkleTree/merkleTree.entity';
import { PluginModule } from '../plugin/plugin.module';
import { MerkleTreeModule } from '../merkleTree/merkleTree.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Nft, Tier, Collection, PluginEntity, CollectionPlugin, MerkleTree]),
        TypeOrmModule.forFeature([Asset721], 'sync_chain'),
        forwardRef(() => Asset721Module),
        forwardRef(() => PluginModule),
        forwardRef(() => MerkleTreeModule),
        forwardRef(() => CollectionPluginModule),
    ],
    exports: [NftModule],
    providers: [Asset721Service, NftService, NftResolver, CollectionPluginService],
})
export class NftModule {
}
