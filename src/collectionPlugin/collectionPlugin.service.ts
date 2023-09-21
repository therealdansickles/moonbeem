import { Collection as CollectionEntity } from '../collection/collection.entity';
import { CollectionPlugin as CollectionPluginEntity } from '../collectionPlugin/collectionPlugin.entity';
import { Plugin as PluginEntity } from '../plugin/plugin.entity';

import { CollectionPlugin, CreateCollectionPluginInput, UpdateCollectionPluginInput } from './collectionPlugin.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MerkleTree as MerkleTreeEntity } from '../merkleTree/merkleTree.entity';

@Injectable()
export class CollectionPluginService {
    constructor(
        @InjectRepository(CollectionEntity)
        private readonly collectionRepository: Repository<CollectionEntity>,
        @InjectRepository(PluginEntity)
        private readonly pluginRepository: Repository<PluginEntity>,
        @InjectRepository(CollectionPluginEntity)
        private readonly collectionPluginRepository: Repository<CollectionPluginEntity>,
        @InjectRepository(MerkleTreeEntity)
        private readonly merkleTreeRepo: Repository<MerkleTreeEntity>
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

    async updateCollectionPlugin(updateCollectionPluginInput: UpdateCollectionPluginInput): Promise<CollectionPlugin> {
        const { id, pluginDetail, ...others } = updateCollectionPluginInput;
        const current = await this.collectionPluginRepository.findOne({ where: { id } });
        if (!current) throw new Error(`CollectionPlugin ${id} doesn't exist.`);
        const newCollectionPlugin = this.collectionPluginRepository.create({
            ...current,
            pluginDetail,
            ...others,
        });
        await this.collectionPluginRepository.update(id, newCollectionPlugin);
        return this.getCollectionPlugin(id);
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

    async getTokenInstalledPlugins(collectionId: string, tokenId: string): Promise<CollectionPlugin[]> {
        const plugins = await this.getCollectionPluginsByCollectionId(collectionId);
        const appliedPlugins = [];
        for (const plugin of plugins) {
            const applied = await this.checkIfPluginApplied(plugin, tokenId);
            if (applied) {
                appliedPlugins.push(plugin);
            }
        }
        return appliedPlugins;
    }

    async checkIfPluginApplied(plugin: CollectionPlugin, tokenId: string): Promise<boolean> {
        const { merkleRoot } = plugin;
        if (!merkleRoot) return true;
        return await this.merkleTreeRepo
            .createQueryBuilder('merkleTree')
            .select('id')
            .where('merkleTree.merkleRoot = :merkleRoot', { merkleRoot })
            .andWhere(`data @> '[{"tokenId": "${tokenId}"}]'`)
            .getExists();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async checkIfPluginClaimed(plugin: CollectionPlugin, tokenId: string): Promise<boolean> {
        // check if there is a claim record for this plugin and tokenId
        return true;
    }

    async getAppliedTokensCount(collectionPlugin: CollectionPlugin, totalSupply: number): Promise<number> {
        const { merkleRoot } = collectionPlugin;
        if (!merkleRoot) return totalSupply;
        const merkleTree = await this.merkleTreeRepo.findOne({ where: { merkleRoot } });
        if (!merkleTree) return 0;
        return (merkleTree.data || []).length;
    }
}
