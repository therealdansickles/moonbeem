import { Collection as CollectionEntity } from '../collection/collection.entity';
import { CollectionPlugin as CollectionPluginEntity } from '../collectionPlugin/collectionPlugin.entity';
import { Plugin as PluginEntity } from '../plugin/plugin.entity';

import {
    CollectionPlugin,
    CreateCollectionPluginInput,
    InstalledPluginInfo,
    UpdateCollectionPluginInput
} from './collectionPlugin.dto';

import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MerkleTree as MerkleTreeEntity } from '../merkleTree/merkleTree.entity';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { Asset721, Asset721 as Asset721Entity } from '../sync-chain/asset721/asset721.entity';

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
        private readonly merkleTreeRepo: Repository<MerkleTreeEntity>,
        @InjectRepository(Asset721, 'sync_chain')
        private readonly asset721Repository: Repository<Asset721Entity>,
        private readonly asset721Service: Asset721Service,
    ) {
    }

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

    async deleteCollectionPlugin(id: string): Promise<boolean> {
        const current = await this.collectionPluginRepository.findOne({ where: { id } });
        if (!current) throw new Error(`CollectionPlugin ${id} doesn't exist.`);
        await this.collectionPluginRepository.delete(id);
        return true;
    }

    async getCollectionPluginsByCollectionId(collectionId: string): Promise<CollectionPlugin[]> {
        return (await this.collectionPluginRepository.find({
            where: { collection: { id: collectionId } },
            relations: {
                plugin: true,
                collection: {
                    children: true,
                    parent: true,
                },
            },
        })) as CollectionPlugin[];
    }

    async getTokenInstalledPlugins(collectionId: string, tokenId: string): Promise<InstalledPluginInfo[]> {
        const CollectionPlugins = await this.getCollectionPluginsByCollectionId(collectionId);
        const appliedPlugins = [];
        for (const collectionPlugin of CollectionPlugins) {
            const applied = await this.checkIfPluginApplied(collectionPlugin, tokenId);
            if (applied) {
                const claimed = await this.checkIfPluginClaimed(collectionPlugin, tokenId);
                const { name, pluginDetail, plugin, description, mediaUrl } = collectionPlugin;
                const { collectionAddress, tokenAddress } = pluginDetail || {};
                appliedPlugins.push({
                    name,
                    collectionAddress,
                    tokenAddress,
                    pluginName: plugin.name,
                    description,
                    mediaUrl,
                    claimed,
                });
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
            .andWhere(`data @> '[{"tokenId": ${tokenId}}]'`)
            .getExists();
    }

    async checkIfPluginClaimed(plugin: CollectionPlugin, tokenId: string): Promise<boolean> {
        const { pluginDetail } = plugin;
        const { tokenAddress } = pluginDetail || {};
        if (!tokenAddress) return false;
        const asset721 = await this.asset721Service.getAsset721({ tokenId, address: tokenAddress });
        return !!asset721;
    }

    async getAppliedTokensCount(collectionPlugin: CollectionPlugin, totalSupply: number): Promise<number> {
        const { merkleRoot } = collectionPlugin;
        if (!merkleRoot) return totalSupply;
        const merkleTree = await this.merkleTreeRepo.findOne({ where: { merkleRoot } });
        if (!merkleTree) return 0;
        return (merkleTree.data || []).length;
    }

    async getClaimedCount(collectionPlugin: CollectionPlugin): Promise<number> {
        const { pluginDetail } = collectionPlugin;
        const { tokenAddress: address } = pluginDetail || {};
        if (!address) return 0;
        return await this.asset721Repository.countBy({ address });
    }
}
