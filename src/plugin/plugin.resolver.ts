import { GraphQLError } from 'graphql';
import { cloneDeep, concat, uniq } from 'lodash';
import { In } from 'typeorm';

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CollectionService } from '../collection/collection.service';
import { Public } from '../session/session.decorator';
import { Tier } from '../tier/tier.dto';
import { TierService } from '../tier/tier.service';
import { InstallOnCollectionInput, InstallOnTierInput, Plugin } from './plugin.dto';
import { IPluginQuery, PluginService } from './plugin.service';

@Resolver(() => Plugin)
export class PluginResolver {
    constructor(
        private readonly pluginService: PluginService,
        private readonly collectionService: CollectionService,
        private readonly tierService: TierService
    ) {}

    @Public()
    @Query(() => [Plugin])
    async plugins(@Args({ name: 'collectionId', nullable: true }) collectionId?: string) {
        const query: IPluginQuery = {};
        if (collectionId) {
            const tiers = await this.tierService.getTiers({ collection: { id: collectionId } });
            const names = (tiers || []).reduce((accu, tier) => {
                const uses = tier.metadata.uses || [];
                return uniq(concat(accu, uses));
            }, []);
            query.name = In([...names]);
        }
        return await this.pluginService.getPlugins(query);
    }

    @Public()
    @Query(() => Plugin)
    async plugin(@Args('id') id: string) {
        return await this.pluginService.getPlugin(id);
    }

    // @AuthorizedCollectionOwner('collectionId')
    @Public()
    @Mutation(() => [Tier])
    async installOnCollection(@Args('input') input: InstallOnCollectionInput) {
        const collection = await this.collectionService.getCollection(input.collectionId);
        if (!collection) throw new GraphQLError(`Collection ${input.collectionId} doesn't exsit.`);

        const tiers = await this.tierService.getTiers({ collection: { id: input.collectionId } });
        if (!tiers || tiers.length === 0) throw new GraphQLError(`Collection ${input.collectionId} doesn't have tiers.`);

        const plugin = await this.pluginService.getPlugin(input.pluginId);
        if (!plugin) throw new GraphQLError(`Plugin ${input.pluginId} doesn't exist.`);

        return Promise.all(tiers.map(tier => {
            const pluginData = cloneDeep(plugin);
            return this.pluginService.installOnTier({ tier, plugin: pluginData, customizedMetadataParameters: input.metadata });
        }));
    }

    @Mutation(() => Tier)
    async installOnTier(@Args('input') input: InstallOnTierInput) {
        const tier = await this.tierService.getTier({ id: input.tierId });
        if (!tier) throw new GraphQLError(`Tier ${input.tierId} doesn't exist.`);

        const plugin = await this.pluginService.getPlugin(input.pluginId);
        if (!plugin) throw new GraphQLError(`Plugin ${input.pluginId} doesn't exist.`);

        return this.pluginService.installOnTier({ tier, plugin, customizedMetadataParameters: input.metadata });
    }
}
