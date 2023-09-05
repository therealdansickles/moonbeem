import { CollectionPlugin, CreateCollectionPluginInput } from './collectionPlugin.dto';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CollectionPluginService } from './collectionPlugin.service';
import { Public } from '../session/session.decorator';

@Resolver(() => CollectionPlugin)
export class CollectionPluginResolver {
    constructor(private readonly collectionPluginService: CollectionPluginService) {}

    @Public()
    @Query(() => [CollectionPlugin])
    async collectionPlugins(@Args('collectionId') collectionId?: string): Promise<CollectionPlugin[]> {
        return await this.collectionPluginService.getCollectionPluginsByCollectionId(collectionId);
    }

    @Mutation(() => CollectionPlugin)
    async createCollectionPlugin(@Args('input') input: CreateCollectionPluginInput): Promise<CollectionPlugin> {
        return await this.collectionPluginService.createCollectionPlugin(input);
    }
}
