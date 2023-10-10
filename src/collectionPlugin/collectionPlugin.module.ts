import { CollectionPlugin } from './collectionPlugin.entity';
import { Plugin } from '../plugin/plugin.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionPluginResolver } from './collectionPlugin.resolver';
import { CollectionPluginService } from './collectionPlugin.service';
import { Collection } from '../collection/collection.entity';
import { forwardRef, Module } from '@nestjs/common';
import { MerkleTree } from '../merkleTree/merkleTree.entity';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([CollectionPlugin, Plugin, Collection, MerkleTree]),
        TypeOrmModule.forFeature([Asset721], 'sync_chain'),
        forwardRef(() => Asset721Module),
    ],
    exports: [CollectionPluginModule, CollectionPluginResolver, CollectionPluginService],
    providers: [CollectionPluginService, CollectionPluginResolver, Asset721Service],
})
export class CollectionPluginModule {
}
