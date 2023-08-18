import { merge, uniq } from 'lodash';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { MetadataCondition, MetadataInput } from '../metadata/metadata.dto';
import { Tier as TierDto } from '../tier/tier.dto';
import { TierService } from '../tier/tier.service';
import { Plugin } from './plugin.entity';

export interface IPluginQuery {
    isPublished?: boolean;
    name?: any;
}

@Injectable()
export class PluginService {
    constructor(
        @InjectRepository(Plugin) private readonly pluginRepository: Repository<Plugin>,
        private tierService: TierService,
    ) {}

    /**
     * Retrieve all plugins
     * @returns
     */
    async getPlugins(query: IPluginQuery = {}): Promise<Plugin[]> {
        query = { isPublished: true, ...query };
        return await this.pluginRepository.findBy(query);
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
    async installOnTier(payload: { tier: TierDto, plugin: Plugin, customizedMetadataParameters?: MetadataInput}) {
        const { tier, plugin, customizedMetadataParameters } = payload;
        const { uses = [], properties = {}, conditions = {} as MetadataCondition, configs = {} } = tier.metadata;
        const metadataPayload = {
            // add plugin name on uses
            uses: uniq(uses.concat(plugin.name)).sort(),
            // merge properties
            // `plugin.metadata.properties`: the properties data come from new installed plugin
            // `properties`: the existed properties on the tier
            properties: merge(plugin.metadata.properties, properties),
            // merge conditions
            // `plugin.metadata.conditions`: the conditions data come from new installed plugin
            // `conditions`: the existed condition on the tier
            // `customizedMetadataParameters.conditions`: the customized conditions parameter by end user
            conditions: merge(plugin.metadata.conditions, conditions, customizedMetadataParameters?.conditions),
            // merge configs
            // `configs`: the existed config on the tier
            // ``customizedMetadataParameters.configs`: the customized configs parameter by end user`
            configs: merge(configs, customizedMetadataParameters?.configs),
        };
        await this.tierService.updateTier(tier.id, { metadata: metadataPayload });
        return this.tierService.getTier(tier.id);
    }
}