import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { InstallOnCollectionInput, InstallOnTierInput, Plugin } from './plugin.dto';
import { PluginService } from './plugin.service';

@Resolver(() => Plugin)
export class PluginResolver {
    constructor(
        private readonly pluginService: PluginService,
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
    async installOnTier(@Args('input') input: InstallOnTierInput) {}
}