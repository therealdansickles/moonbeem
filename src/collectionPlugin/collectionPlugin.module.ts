import { CollectionPlugin } from './collectionPlugin.entity';
import { Plugin } from '../plugin/plugin.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionPluginResolver } from './collectionPlugin.resolver';
import { CollectionPluginService } from './collectionPlugin.service';
import { Collection } from '../collection/collection.entity';
import { Module } from '@nestjs/common';
import { MerkleTree } from '../merkleTree/merkleTree.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CollectionPlugin, Plugin, Collection, MerkleTree])],
    exports: [CollectionPluginModule, CollectionPluginResolver, CollectionPluginService],
    providers: [CollectionPluginService, CollectionPluginResolver],
})
export class CollectionPluginModule {}
