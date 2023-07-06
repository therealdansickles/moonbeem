import { merge, sort, unique } from 'lodash';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { MetadataInput } from '../metadata/metadata.dto';
import { Tier } from '../tier/tier.dto';
import { Plugin } from './plugin.entity';

@Injectable()
export class PluginService {
    constructor(
        @InjectRepository(Plugin) private readonly pluginRepository: Repository<Plugin>,
        @InjectRepository(Tier) private readonly tierRepository: Repository<Tier>
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

    async installOnTier(payload: { tier: Tier, plugin: Plugin, metadata: MetadataInput}) {
        const { tier, plugin, metadata } = payload;
        const { uses = [], properties = {}, conditions = {} } = tier.metadata;
        const metadataPayload = {
            uses: sort(unique(uses.push(plugin.name))),
            properties: merge(properties, metadata.properties),
            conditions: merge(conditions, metadata.conditions)
        }
        await this.tierRepository.update(tier.id, { metadata: metadataPayload });
        return this.tierRepository.findOneBy({ id: tier.id })
    }
}