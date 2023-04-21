import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Public } from '../lib/decorators/public.decorator';
import { CollectionService } from './collection.service';
import {
    Collection,
    CreateCollectionInput,
    UpdateCollectionInput,
    PublishCollectionInput,
    DeleteCollectionInput,
} from './collection.dto';

@Resolver('Collection')
export class CollectionResolver {
    constructor(private readonly collectionService: CollectionService) {}

    @Public()
    @Query(() => Collection, { description: 'returns a collection for a given uuid', nullable: true })
    async collection(@Args('id') id: string): Promise<Collection> {
        return this.collectionService.getCollection(id);
    }

    @Mutation(() => Collection, { description: 'creates a collection' })
    async createCollection(@Args('input') input: CreateCollectionInput): Promise<Collection> {
        return this.collectionService.createCollection(input);
    }

    @Public()
    @Mutation(() => Boolean, { description: 'updates a collection' })
    async updateCollection(@Args('input') input: UpdateCollectionInput): Promise<boolean> {
        const { id } = input;
        return this.collectionService.updateCollection(id, input);
    }

    @Public()
    @Mutation(() => Boolean, { description: 'publishes a collection' })
    async publishCollection(@Args('input') input: PublishCollectionInput): Promise<boolean> {
        const { id } = input;
        return this.collectionService.publishCollection(id);
    }

    @Public()
    @Mutation(() => Boolean, { description: 'delete a unpublished collection' })
    async deleteCollection(@Args('input') input: DeleteCollectionInput): Promise<boolean> {
        const { id } = input;
        return await this.collectionService.deleteCollection(id);
    }
}
