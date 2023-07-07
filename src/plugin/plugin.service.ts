import { merge, uniq } from 'lodash';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CollectionService } from '../collection/collection.service';
import { MetadataInput } from '../metadata/metadata.dto';
import { Tier as TierDto } from '../tier/tier.dto';
import { TierService } from '../tier/tier.service';
import { Plugin } from './plugin.entity';

@Injectable()
export class PluginService {
    constructor(
        @InjectRepository(Plugin) private readonly pluginRepository: Repository<Plugin>,
        private tierService: TierService,
        private collectionService: CollectionService,
    ) {}

    /**
     * Retrieve all plugins
     * @returns
     */
    async getPlugins(): Promise<Plugin[]> {
        return await this.pluginRepository.findBy({ isPublish: true });
    }

    /**
     * Retrieve a plugin by id.
     *
     * @param id The id of the plugin to retrieve.
     * @returns The plugin.
     */
    async getPlugin(id: string): Promise<Plugin> {
        return await this.pluginRepository.findOneBy({ id });
    }

    /**
     * Install a plugin on the given tier, with customized config of metadata
     *
     * @param payload
     * @returns
     */
    async installOnTier(payload: { tier: TierDto, plugin: Plugin, metadata?: MetadataInput}) {
        const { tier, plugin, metadata } = payload;
        const { uses = [], properties = {}, conditions = {} } = tier.metadata;
        const metadataPayload = {
            // add plugin name on uses
            uses: uniq(uses.push(plugin.name)).sort(),
            // merge properties
            properties: merge(properties, plugin.metadata.properties),
            // merge conditions
            conditions: merge(conditions, plugin.metadata.conditions, metadata?.conditions)
        }
        await this.tierService.updateTier(tier.id, { metadata: metadataPayload });
        return this.tierService.getTier(tier.id)
    }
}