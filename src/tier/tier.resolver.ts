import { GraphQLJSONObject } from 'graphql-type-json';

import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { SigninByEmailGuard } from '../session/session.guard';
import { TierHoldersPaginated } from '../wallet/wallet.dto';
import {
    AttributeOverviewInput,
    CreateTierInput,
    DeleteTierInput,
    IOverview,
    Profit,
    Tier,
    TierSearchInput,
    TierSearchPaginated,
    UpdateTierInput,
} from './tier.dto';
import { ITierListQuery, TierService } from './tier.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import { Coin } from '../sync-chain/coin/coin.dto';
import { ZeroAddress } from 'ethers';

@Resolver(() => Tier)
export class TierResolver {
    constructor(private readonly tierService: TierService, private readonly coinService: CoinService) {}

    @Public()
    @Query(() => Tier, { description: 'Get a specific tier by id.', nullable: true })
    async tier(@Args('id') id: string): Promise<Tier> {
        return await this.tierService.getTier({ id });
    }

    @Public()
    @Query(() => [Tier], { description: 'Get tiers by collection id', nullable: true })
    async tiers(
        @Args({ name: 'collectionId', nullable: true }) collectionId?: string,
            @Args({ name: 'name', nullable: true }) name?: string,
            @Args({ name: 'pluginName', nullable: true }) pluginName?: string
    ): Promise<Tier[]> {
        const query: ITierListQuery = { name, pluginName };
        if (collectionId) query.collection = { id: collectionId };
        return await this.tierService.getTiers(query);
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

    @ResolveField(() => Int, { description: 'Returns the total sold for the given tier' })
    async totalSold(@Parent() tier: Tier): Promise<number> {
        return await this.tierService.getTierTotalSold(tier);
    }

    @ResolveField(() => Profit, { description: 'Returns the total raised for the given tier' })
    async profit(@Parent() tier: Tier): Promise<Profit> {
        return await this.tierService.getTierProfit(tier.id);
    }

    @ResolveField(() => TierHoldersPaginated, { description: 'Returns the holder data for a tier.' })
    async holders(
        @Parent() tier: Tier,
            @Args('before', { nullable: true }) before?: string,
            @Args('after', { nullable: true }) after?: string,
            @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
            @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number
    ): Promise<TierHoldersPaginated> {
        return this.tierService.getHolders(tier.id, before, after, first, last);
    }

    @ResolveField(() => Coin, { description: 'Returns the coin for the given tier' })
    async coin(@Parent() tier: Tier): Promise<Coin> {
        if (tier.paymentTokenAddress === ZeroAddress) {
            return { name: 'Ether',
                symbol: 'ETH',
                address: ZeroAddress,
                decimals: 18,
                chainId: 0,
                native: true,
            } as Coin;
        }

        return this.coinService.getCoinByAddress(tier.paymentTokenAddress.toLowerCase());
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
        const { collectionId, collectionAddress, collectionSlug, keyword, properties, plugins, upgrades } = input;
        return this.tierService.searchTier(
            { collectionId, collectionAddress, collectionSlug, keyword, properties, plugins, upgrades },
            before,
            after,
            first,
            last
        );
    }

    /**
     * attributeOverview for collection/tier
     * @param collectionAddress @deprecated, use input instead
     * @param input collectionAddress, collectionSlug
     */
    @Public()
    @Query(() => GraphQLJSONObject, { description: 'Returns attributes overview for collection/tier' })
    async attributeOverview(
        @Args('collectionAddress', { nullable: true }) collectionAddress: string,
            @Args('input', { nullable: true }) input?: AttributeOverviewInput
    ): Promise<IOverview> {
        const mergedCollectionAddress = input.collectionAddress || collectionAddress;
        const collectionSlug = input.collectionSlug;
        return this.tierService.getAttributesOverview({
            collectionAddress: mergedCollectionAddress,
            collectionSlug,
        });
    }
}
