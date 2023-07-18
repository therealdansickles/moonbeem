import { GraphQLJSONObject } from 'graphql-type-json';

import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { SigninByEmailGuard } from '../session/session.guard';
import { TierHolders } from '../wallet/wallet.dto';
import {
    CreateTierInput,
    DeleteTierInput,
    IOverview,
    Profit,
    Tier,
    TierSearchInput,
    TierSearchPaginated,
    UpdateTierInput,
} from './tier.dto';
import { ITierQuery, TierService } from './tier.service';

@Resolver(() => Tier)
export class TierResolver {
    constructor(private readonly tierService: TierService) {}

    @Public()
    @Query(() => Tier, { description: 'Get a specific tier by id.', nullable: true })
    async tier(@Args('id') id: string): Promise<Tier> {
        return await this.tierService.getTier(id);
    }

    @Public()
    @Query(() => [Tier], { description: 'Get tiers by collection id', nullable: true })
    async tiers(@Args('collectionId') collectionId: string, @Args('name') name: string): Promise<Tier[]> {
        const query: ITierQuery = { name };
        if (collectionId) query.collection = { id: collectionId };
        return await this.tierService.getTiersByQuery(query);
    }

    @UseGuards(SigninByEmailGuard)
    @Mutation(() => Tier, { description: 'Create a new tier.' })
    async createTier(@Args('input') input: CreateTierInput): Promise<Tier> {
        return await this.tierService.createTier(input);
    }

    @Mutation(() => Boolean, { description: 'Update a tier.' })
    async updateTier(@Args('input') input: UpdateTierInput): Promise<boolean> {
        const { id } = input;
        return await this.tierService.updateTier(id, input);
    }

    @Mutation(() => Boolean, { description: 'Delete a tier.' })
    async deleteTier(@Args('input') input: DeleteTierInput): Promise<boolean> {
        const { id } = input;
        return await this.tierService.deleteTier(id);
    }

    @Public()
    @ResolveField(() => Int, { description: 'Returns the total sold for the given tier' })
    async totalSold(@Parent() tier: Tier): Promise<number> {
        return await this.tierService.getTierTotalSold(tier.id);
    }

    @Public()
    @ResolveField(() => Profit, { description: 'Returns the total raised for the given tier' })
    async profit(@Parent() tier: Tier): Promise<Profit> {
        return await this.tierService.getTierProfit(tier.id);
    }

    @Public()
    @ResolveField(() => TierHolders, { description: 'Returns the holder for a tier.' })
    async holders(
        @Parent() tier: Tier,
        @Args('offset', { type: () => Int, nullable: true, defaultValue: 0 }) offset?: number,
        @Args('limit', { type: () => Int, nullable: true, defaultValue: 10 }) limit?: number
    ): Promise<TierHolders> {
        return await this.tierService.getHolders(tier.id, offset, limit);
    }

    @Public()
    @Query(() => TierSearchPaginated, { description: 'Returns the search result for tier', nullable: true })
    async searchTierFromCollection(
        @Args('input') input: TierSearchInput,
        @Args('before', { nullable: true }) before?: string,
        @Args('after', { nullable: true }) after?: string,
        @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
        @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number
    ): Promise<TierSearchPaginated> {
        const { collectionId, collectionAddress, keyword, properties, plugins, upgrades } = input;
        return this.tierService.searchTier(
            { collectionId, collectionAddress, keyword, properties, plugins, upgrades },
            before,
            after,
            first,
            last
        );
    }

    @Public()
    @Query(() => GraphQLJSONObject, { description: 'Returns attributes overview for collection/tier' })
    async attributeOverview(@Args('collectionAddress') collectionAddress: string): Promise<IOverview> {
        return this.tierService.getArrtibutesOverview(collectionAddress);
    }
}
