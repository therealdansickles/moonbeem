import { Resolver, Query, Args, Mutation, ResolveField, Parent } from '@nestjs/graphql';
import { Public } from '../lib/decorators/public.decorator';
import { CollectionService } from './collection.service';
import {
    Collection,
    CreateCollectionInput,
    UpdateCollectionInput,
    PublishCollectionInput,
    DeleteCollectionInput,
} from './collection.dto';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.dto';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';

@Resolver(() => Collection)
export class CollectionResolver {
    constructor(
        private readonly collectionService: CollectionService,
        private readonly MintSaleContractService: MintSaleContractService
    ) {}

    @Public()
    @Query(() => Collection, { description: 'returns a collection for a given uuid', nullable: true })
    async collection(
        @Args({ name: 'id', nullable: true }) id: string,
        @Args({ name: 'address', nullable: true }) address: string
    ): Promise<Collection> {
        return id ? this.collectionService.getCollection(id) : this.collectionService.getCollectionByAddress(address);
    }

    @Public()
    @Mutation(() => Collection, { description: 'creates a collection' })
    async createCollection(@Args('input') input: CreateCollectionInput): Promise<Collection> {
        return this.collectionService.createCollectionWithTiers(input);
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

    @Public()
    @ResolveField(() => MintSaleContract, { description: 'Returns the contract for the given collection' })
    async contract(@Parent() collection: Collection): Promise<MintSaleContract> {
        return await this.MintSaleContractService.getMintSaleContractByCollection(collection.id);
    }
}
