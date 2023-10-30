import { merge, mergeWith, uniq } from 'lodash';
import { render } from 'mustache';
import { Repository } from 'typeorm';
import { v4 } from 'uuid';

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
        const plugins = await this.pluginRepository.findBy(query);
        return this.patchPredefined(plugins);
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
     * Patch predefined values for the plugin.
     * the predefined delimiters are '[[' and ']]' just compare to normal delimiters '{{' and '}} }
     *
     * @param id
     * @param path
     */
    async patchPredefined(plugins: Plugin[]) {
        for (const plugin of plugins) {
            // now we only need have id attached on the return data
            plugin.metadata = JSON.parse(render(JSON.stringify(plugin.metadata), { id: v4() }, {}, ['[[', ']]']));
        }
        return plugins;
    }

    /**
     * Install a plugin on the given tier, with customized config of metadata
     *
     * @param payload
     * @returns
     */
    async installOnTier(payload: {
        tier: TierDto;
        plugin: Plugin;
        collectionPlugin?: { id: string };
        customizedPluginName?: string;
        customizedMetadataParameters?: MetadataInput;
    }) {
        const { tier, plugin, collectionPlugin, customizedMetadataParameters, customizedPluginName } = payload;
        const {
            uses: existedUses = [],
            properties: existedProperties = {},
            conditions: existedConditions = {} as MetadataCondition,
            configs: existedConfigs = {},
        } = tier.metadata;

        const installedPluginId = collectionPlugin && collectionPlugin.id ? collectionPlugin.id : v4();
        // generate install plugin name
        const renderedPluginName = render(plugin.name, { id: installedPluginId }, {}, ['[[', ']]']);
        const pluginName = customizedPluginName || renderedPluginName;

        if (existedUses.indexOf(pluginName) >= 0) throw new Error(`Can't install ${plugin.name} more than once`);

        // generate & merge properties
        // merge properties
        // `plugin.metadata.properties`: the properties data come from new installed plugin
        // `properties`: the existed properties on the tier
        const renderedPluginProperties = JSON.parse(
            render(JSON.stringify(plugin.metadata?.properties || {}), { id: installedPluginId }, {}, ['[[', ']]']),
        );
        const properties = merge(renderedPluginProperties, existedProperties);

        // generate configs & merge configs
        // `existedConfigs`: the existed config on the tier
        // `plugin.metadata.configs`: the config on ther plugin
        // `customizedMetadataParameters.configs`: the customized configs parameter by end user`
        const mergedConfig = mergeWith(
            existedConfigs,
            plugin.metadata?.configs || {},
            customizedMetadataParameters?.configs || {},
            (objValue, srcValue) => {
                if (Array.isArray(objValue)) {
                    return objValue.concat(srcValue);
                }
            },
        );
        const configs = JSON.parse(render(JSON.stringify(mergedConfig), { id: installedPluginId }, {}, ['[[', ']]']));

        // merge conditions
        // `plugin.metadata.conditions`: the conditions data come from new installed plugin
        // `conditions`: the existed condition on the tier
        // `customizedMetadataParameters.conditions`: the customized conditions parameter by end user
        const conditions = merge(plugin.metadata?.conditions || {}, existedConditions, customizedMetadataParameters?.conditions);

        const metadataPayload = {
            // add plugin name on uses
            uses: uniq(existedUses.concat(pluginName)).sort(),
            properties,
            conditions,
            configs,
        };
        await this.tierService.updateTier(tier.id, { metadata: metadataPayload });
        return this.tierService.getTier({ id: tier.id });
    }
}
