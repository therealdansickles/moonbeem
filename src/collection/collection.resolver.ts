import { Resolver, Query, Args, Mutation, ResolveField, Parent } from '@nestjs/graphql';
import { Public } from '../session/session.decorator';
import { CollectionService } from './collection.service';
import {
    Collection,
    CollectionInput,
    CreateCollectionInput,
    UpdateCollectionInput,
    CollectionStat,
} from './collection.dto';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.dto';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { CollectionHolder } from '../wallet/wallet.dto';

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
        @Args({ name: 'address', nullable: true }) address: string,
        @Args({ name: 'name', nullable: true }) name: string
    ): Promise<Collection> {
        return this.collectionService.getCollectionByQuery({ id, address, name });
    }

    @Public()
    @Mutation(() => Collection, { description: 'creates a collection' })
    async createCollection(@Args('input') input: CreateCollectionInput): Promise<Collection> {
        return this.collectionService.createCollectionWithTiers(input);
    }

    @Mutation(() => Boolean, { description: 'updates a collection' })
    async updateCollection(@Args('input') input: UpdateCollectionInput): Promise<boolean> {
        const { id } = input;
        return this.collectionService.updateCollection(id, input);
    }

    @Public()
    @Mutation(() => Boolean, { description: 'publishes a collection' })
    async publishCollection(@Args('input') input: CollectionInput): Promise<boolean> {
        return this.collectionService.publishCollection(input.id);
    }

    @Mutation(() => Boolean, { description: 'delete a unpublished collection' })
    async deleteCollection(@Args('input') input: CollectionInput): Promise<boolean> {
        return await this.collectionService.deleteCollection(input.id);
    }

    @Public()
    @ResolveField(() => [String], { description: 'returns the buyers of a collection' })
    async buyers(@Parent() collection: Collection): Promise<string[]> {
        return this.collectionService.getBuyers(collection.address);
    }

    @Public()
    @ResolveField(() => MintSaleContract, { description: 'Returns the contract for the given collection' })
    async contract(@Parent() collection: Collection): Promise<MintSaleContract> {
        return await this.MintSaleContractService.getMintSaleContractByCollection(collection.id);
    }

    @Public()
    @ResolveField(() => CollectionHolder, { description: 'Returns the holder for a collection.' })
    async holder(
        @Parent() collection: Collection,
        @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
        @Args('limit', { nullable: true, defaultValue: 10 }) limit?: number
    ): Promise<CollectionHolder> {
        return this.collectionService.getHolders(collection.address, offset, limit);
    }

    @Public()
    @ResolveField(() => Number, { description: 'Returns the unique holder count for collection.' })
    async uniqueHolderCount(@Parent() collection: Collection): Promise<number> {
        return this.collectionService.getUniqueHolderCount(collection.address);
    }

    @Public()
    @Query(() => [CollectionStat], { description: 'Get collection stat from secondary markets' })
    async secondaryMarketStat(
        @Args({ name: 'id', nullable: true }) id: string,
        @Args({ name: 'address', nullable: true }) address: string
    ): Promise<CollectionStat[]> {
        return this.collectionService.getSecondartMarketStat({ id, address });
    }
}
