import { GraphQLError } from 'graphql';

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { TierService } from '../tier/tier.service';
import { InstallOnCollectionInput, InstallOnTierInput, Plugin } from './plugin.dto';
import { PluginService } from './plugin.service';

@Resolver(() => Plugin)
export class PluginResolver {
    constructor(
        private readonly pluginService: PluginService,
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

    @Mutation()
    async installOnCollection(@Args('input') input: InstallOnCollectionInput) {}

    @Mutation()
    async installOnTier(@Args('input') input: InstallOnTierInput) {
        const tier = await this.tierService.getTier(input.tierId);
        if (!tier) throw new GraphQLError(`Tier ${input.tierId} doesn't exist.`);

        const plugin = await this.pluginService.getPlugin(input.pluginId);
        if (!plugin) throw new GraphQLError(`Plugin ${input.pluginId} doesn't exist.`);

        return await this.pluginService.installOnTier({ tier, plugin, metadata: input.metadata });
    }
}