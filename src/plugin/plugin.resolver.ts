import { GraphQLError } from 'graphql';

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { CollectionService } from '../collection/collection.service';
import { AuthorizedCollectionOwner, Public } from '../session/session.decorator';
import { Tier } from '../tier/tier.dto';
import { TierService } from '../tier/tier.service';
import { InstallOnCollectionInput, InstallOnTierInput, Plugin } from './plugin.dto';
import { PluginService } from './plugin.service';

@Resolver(() => Plugin)
export class PluginResolver {
    constructor(
        private readonly pluginService: PluginService,
        private readonly collectionService: CollectionService,
        private readonly tierService: TierService,
    ) {}

    @Public()
    @Query(() => [Plugin])
    async plugins() {
        return await this.pluginService.getPlugins();
    }

    @Public()
    @Query(() => Plugin)
    async plugin(@Args('id') id: string) {
        return await this.pluginService.getPlugin(id);
    }

    @AuthorizedCollectionOwner('collectionId')
    @Mutation(() => [Tier])
    async installOnCollection(@Args('input') input: InstallOnCollectionInput) {
        const collection = await this.collectionService.getCollection(input.collectionId);
        if (!collection) throw new GraphQLError(`Collection ${input.collectionId} doesn't exsit.`);

        const tiers = await this.tierService.getTiersByQuery({ collection: { id: input.collectionId }});
        if (!tiers || tiers.length === 0)  throw new GraphQLError(`Collection ${input.collectionId} doesn't have tiers.`);
        
        const plugin = await this.pluginService.getPlugin(input.pluginId);
        if (!plugin) throw new GraphQLError(`Plugin ${input.pluginId} doesn't exist.`);

        const promises = tiers.map(tier => this.pluginService.installOnTier({ tier, plugin, customizedMetadataParameters: input.metadata }));
        return Promise.all(promises);
    }
 
    @Mutation(() => Tier)
    async installOnTier(@Args('input') input: InstallOnTierInput) {
        const tier = await this.tierService.getTier(input.tierId);
        if (!tier) throw new GraphQLError(`Tier ${input.tierId} doesn't exist.`);

        const plugin = await this.pluginService.getPlugin(input.pluginId);
        if (!plugin) throw new GraphQLError(`Plugin ${input.pluginId} doesn't exist.`);

        return this.pluginService.installOnTier({ tier, plugin, customizedMetadataParameters: input.metadata });
    }
}