import { CollectionPlugin, CreateCollectionPluginInput, UpdateCollectionPluginInput } from './collectionPlugin.dto';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { CollectionPluginService } from './collectionPlugin.service';
import { Public } from '../session/session.decorator';

@Resolver(() => CollectionPlugin)
export class CollectionPluginResolver {
    constructor(private readonly collectionPluginService: CollectionPluginService) {
    }

    @Public()
    @Query(() => [CollectionPlugin])
    async collectionPlugins(@Args('collectionId') collectionId?: string): Promise<CollectionPlugin[]> {
        return await this.collectionPluginService.getCollectionPluginsByCollectionId(collectionId);
    }

    @Mutation(() => CollectionPlugin)
    async createCollectionPlugin(@Args('input') input: CreateCollectionPluginInput): Promise<CollectionPlugin> {
        return await this.collectionPluginService.createCollectionPlugin(input);
    }

    @Mutation(() => CollectionPlugin)
    async updateCollectionPlugin(@Args('input') input: UpdateCollectionPluginInput): Promise<CollectionPlugin> {
        return await this.collectionPluginService.updateCollectionPlugin(input);
    }

    @Mutation(() => Boolean)
    async deleteCollectionPlugin(@Args('id') id: string): Promise<boolean> {
        return await this.collectionPluginService.deleteCollectionPlugin(id);
    }

    @ResolveField(() => Int)
    async claimedCount(@Parent() collectionPlugin: CollectionPlugin): Promise<number> {
        return await this.collectionPluginService.getClaimedCount(collectionPlugin);
    }
}
