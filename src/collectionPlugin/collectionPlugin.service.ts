import { Collection as CollectionEntity } from '../collection/collection.entity';
import { CollectionPlugin as CollectionPluginEntity } from '../collectionPlugin/collectionPlugin.entity';
import { Plugin as PluginEntity } from '../plugin/plugin.entity';

import { CollectionPlugin, CreateCollectionPluginInput } from './collectionPlugin.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

@Injectable()
export class CollectionPluginService {
    constructor(
        @InjectRepository(CollectionEntity)
        private readonly collectionRepository: Repository<CollectionEntity>,
        @InjectRepository(PluginEntity)
        private readonly pluginRepository: Repository<PluginEntity>,
        @InjectRepository(CollectionPluginEntity)
        private readonly collectionPluginRepository: Repository<CollectionPluginEntity>
    ) {}

    async createCollectionPlugin(createCollectionPluginInput: CreateCollectionPluginInput): Promise<CollectionPlugin> {
        const { collectionId, pluginId, pluginDetail, ...others } = createCollectionPluginInput;
        const collection = await this.collectionRepository.findOne({ where: { id: collectionId } });
        if (!collection) throw new Error(`Collection ${collectionId} doesn't exist.`);

        const plugin = await this.pluginRepository.findOne({ where: { id: pluginId } });
        if (!plugin) throw new Error(`Plugin ${pluginId} doesn't exist.`);

        const collectionPlugin = this.collectionPluginRepository.create({
            collection,
            plugin,
            pluginDetail,
            ...others,
        });

        return (await this.collectionPluginRepository.save(collectionPlugin)) as CollectionPlugin;
    }

    async getCollectionPlugin(id: string): Promise<CollectionPlugin> {
        return (await this.collectionPluginRepository.findOne({
            where: { id },
            relations: {
                plugin: true,
                collection: true,
            },
        })) as CollectionPlugin;
    }

    async getCollectionPluginsByCollectionId(collectionId: string): Promise<CollectionPlugin[]> {
        return (await this.collectionPluginRepository.find({
            where: { collection: { id: collectionId } },
            relations: {
                plugin: true,
                collection: true,
            },
        })) as CollectionPlugin[];
    }
}
