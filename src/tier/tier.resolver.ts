import { Public } from '../lib/decorators/public.decorator';
import { Resolver, Query, Args, Mutation, ResolveField, Parent, Int } from '@nestjs/graphql';

import { Tier, CreateTierInput, UpdateTierInput, DeleteTierInput } from './tier.dto';
import { TierService } from './tier.service';

@Resolver(() => Tier)
export class TierResolver {
    constructor(private readonly tierService: TierService) {}

    @Public()
    @Query(() => Tier, { description: 'Get a specific tier by id.', nullable: true })
    async tier(@Args('id') id: string): Promise<Tier> {
        return await this.tierService.getTier(id);
    }

    @Query(() => [Tier], { description: 'Get tiers by collection id', nullable: true })
    async tiers(@Args('collectionId') collectionId: string): Promise<Tier[]> {
        return await this.tierService.getTiersByCollection(collectionId);
    }

    @Public()
    @Mutation(() => Tier, { description: 'Create a new tier.' })
    async createTier(@Args('input') input: CreateTierInput): Promise<Tier> {
        return await this.tierService.createTier(input);
    }

    @Public()
    @Mutation(() => Boolean, { description: 'Update a tier.' })
    async updateTier(@Args('input') input: UpdateTierInput): Promise<boolean> {
        const { id } = input;
        return await this.tierService.updateTier(id, input);
    }

    @Public()
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
    @ResolveField(() => String, { description: 'Returns the total raised for the given tier' })
    async totalRaised(@Parent() tier: Tier): Promise<string> {
        return await this.tierService.getTierTotalRaised(tier.id);
    }
}
