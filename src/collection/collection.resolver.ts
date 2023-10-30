import { GraphQLError } from 'graphql';

import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.dto';
import { OpenseaService } from '../opensea/opensea.service';
import { OrganizationService } from '../organization/organization.service';
import { AuthorizedCollectionViewer, AuthorizedOrganization, Public, SessionUser } from '../session/session.decorator';
import { SigninByEmailGuard } from '../session/session.guard';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.dto';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { Tier } from '../tier/tier.dto';
import { User } from '../user/user.entity';
import { CollectionHoldersPaginated } from '../wallet/wallet.dto';
import {
    AggregatedVolume,
    Collection,
    CollectionActivities,
    CollectionAggregatedActivityPaginated,
    CollectionEarningsChartPaginated,
    CollectionInput,
    CollectionPaginated,
    CollectionSoldAggregated,
    CollectionSoldPaginated,
    CollectionStat,
    CollectionStatus,
    CreateCollectionInput,
    GrossEarnings,
    LandingPageCollection,
    MetadataOverview,
    MetadataOverviewInput,
    MigrateCollectionInput,
    SearchTokenIdsInput,
    SevenDayVolume,
    UpdateCollectionInput,
} from './collection.dto';
import { CollectionService } from './collection.service';
import { IsNull, Not } from 'typeorm';
import { ContractType } from '../sync-chain/factory/factory.entity';

@Resolver(() => Collection)
export class CollectionResolver {
    constructor(
        private readonly collectionService: CollectionService,
        private readonly mintSaleContractService: MintSaleContractService,
        private readonly openseaService: OpenseaService,
        private readonly organizationService: OrganizationService,
    ) {}

    @AuthorizedCollectionViewer()
    @Query(() => Collection, { description: 'returns a collection for a given uuid (authorized endpoint)', nullable: true })
    async collection(
        @Args({ name: 'id', nullable: true }) id: string,
            @Args({ name: 'address', nullable: true }) address: string,
            @Args({ name: 'name', nullable: true }) name: string,
            @Args({ name: 'slug', nullable: true }) slug: string,
    ): Promise<Collection> {
        return this.collectionService.getCollectionByQuery({ id, address, name, slug });
    }

    @Public()
    @Query(() => Collection, { description: 'returns a collection for a given uuid (public endpoint)', nullable: true })
    async marketCollection(
        @Args({ name: 'id', nullable: true }) id: string,
            @Args({ name: 'address', nullable: true }) address: string,
            @Args({ name: 'name', nullable: true }) name: string,
            @Args({ name: 'slug', nullable: true }) slug: string,
    ): Promise<Collection> {
        return this.collectionService.getCollectionByQuery({
            id,
            address,
            name,
            slug,
            tokenAddress: Not(IsNull()),
        });
    }

    @Public()
    @ResolveField('tiers', () => [Tier], { description: 'Get tiers by collection id', nullable: true })
    async collectionTiers(@Parent() collection: Collection): Promise<Tier[]> {
        return await this.collectionService.getCollectionTiers(collection.id);
    }

    @AuthorizedOrganization('organization.id')
    @UseGuards(SigninByEmailGuard)
    @Mutation(() => Collection, { description: 'creates a collection' })
    async createCollection(@Args('input') input: CreateCollectionInput): Promise<Collection> {
        try {
            await this.collectionService.precheckCollection(input);
        } catch (err) {
            throw new GraphQLError(err.message);
        }
        return this.collectionService.createCollectionWithTiers(input);
    }

    @Mutation(() => Boolean, { description: 'updates a collection' })
    async updateCollection(@Args('input') input: UpdateCollectionInput): Promise<boolean> {
        const { id } = input;
        return this.collectionService.updateCollection(id, input);
    }

    @Mutation(() => Boolean, { description: 'publishes a collection' })
    async publishCollection(@Args('input') input: CollectionInput): Promise<boolean> {
        return this.collectionService.publishCollection(input.id);
    }

    @Mutation(() => Boolean, { description: 'delete a unpublished collection' })
    async deleteCollection(@Args('input') input: CollectionInput): Promise<boolean> {
        return this.collectionService.deleteCollection(input.id);
    }

    @Public()
    @ResolveField(() => [String], { description: 'returns the buyers of a collection' })
    async buyers(@Parent() collection: Collection): Promise<string[]> {
        return this.collectionService.getBuyers(collection.address);
    }

    @Public()
    @ResolveField(() => MintSaleContract, { description: 'Returns the contract for the given collection' })
    async contract(@Parent() collection: Collection): Promise<MintSaleContract> {
        const mintSaleContract = await this.mintSaleContractService.getMintSaleContractByCollection(collection.id);
        return collection.kind === 'migration'
            ? {
                ...mintSaleContract,
                kind: ContractType.migration,
            }
            : mintSaleContract;
    }

    @Public()
    @ResolveField(() => CollectionHoldersPaginated, { description: 'Returns the holder for a collection.' })
    async holders(
        @Parent() collection: Collection,
            @Args('before', { nullable: true }) before?: string,
            @Args('after', { nullable: true }) after?: string,
            @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
            @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number,
    ): Promise<CollectionHoldersPaginated> {
        return this.collectionService.getHolders(collection.address, before, after, first, last);
    }

    @Public()
    @ResolveField(() => Number, { description: 'Returns the unique holder count for collection.', nullable: true })
    async uniqueHolderCount(@Parent() collection: Collection): Promise<number> {
        return this.collectionService.getUniqueHolderCount(collection.address);
    }

    @Public()
    @Query(() => [CollectionStat], { description: 'Get collection stat from secondary markets', nullable: true })
    async secondaryMarketStat(
        @Args({ name: 'id', nullable: true }) id: string,
            @Args({ name: 'address', nullable: true }) address: string,
    ): Promise<CollectionStat[]> {
        return this.collectionService.getSecondaryMarketStat({ id, address });
    }

    @Public()
    @ResolveField(() => CollectionActivities, { description: 'Returns the activity for collection' })
    async activities(
        @Parent() collection: Collection,
            @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
            @Args('limit', { nullable: true, defaultValue: 10 }) limit?: number,
    ): Promise<CollectionActivities> {
        return this.collectionService.getCollectionActivities(collection.address, offset, limit);
    }

    @Public()
    @ResolveField(() => CollectionAggregatedActivityPaginated, {
        description: 'Returns the aggregated activities for collection.',
    })
    async aggregatedActivities(
        @Parent() collection: Collection,
            @Args('before', { nullable: true }) before?: string,
            @Args('after', { nullable: true }) after?: string,
            @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
            @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number,
    ): Promise<CollectionAggregatedActivityPaginated> {
        return this.collectionService.getAggregatedCollectionActivities(collection.address, collection.tokenAddress, before, after, first, last);
    }

    @Public()
    @Query(() => LandingPageCollection, { description: 'Returns the upcoming collections.' })
    async landingPage(
        @Args('status', { nullable: true, defaultValue: CollectionStatus.active }) status: CollectionStatus,
            @Args('offset', { nullable: true, defaultValue: 0 }) offset?: number,
            @Args('limit', { nullable: true, defaultValue: 10 }) limit?: number,
    ): Promise<LandingPageCollection> {
        return this.collectionService.getLandingPageCollections(status, offset, limit);
    }

    @Public()
    @ResolveField(() => String, { description: 'Returns the floor price from tier', nullable: true })
    async floorPrice(@Parent() collection: Collection): Promise<string> {
        return this.collectionService.getFloorPrice(collection.address);
    }

    @Public()
    @Query(() => CollectionPaginated, { description: 'Returns the collection list' })
    async collections(
        @Args('before', { nullable: true }) before?: string,
            @Args('after', { nullable: true }) after?: string,
            @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
            @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number,
    ): Promise<CollectionPaginated> {
        return this.collectionService.getCollections(before, after, first, last);
    }

    @Public()
    @ResolveField(() => CollectionSoldPaginated, { description: 'Returns the sale history per collection.' })
    async sold(
        @Parent() collection: Collection,
            @Args('before', { nullable: true }) before?: string,
            @Args('after', { nullable: true }) after?: string,
            @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
            @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number,
    ): Promise<CollectionSoldPaginated> {
        return this.collectionService.getCollectionSold(collection.address, before, after, first, last);
    }

    @Public()
    @ResolveField(() => CollectionSoldAggregated, {
        description: 'Returns the aggregated sale history for collection.',
    })
    async aggregatedSold(@Parent() collection: Collection): Promise<CollectionSoldAggregated> {
        return this.collectionService.getAggregatedCollectionSold(collection.address, collection.tokenAddress);
    }

    @Public()
    @ResolveField(() => Int, { description: 'Returns total amount of unique wallets that have purchased.' })
    async owners(@Parent() collection: Collection): Promise<number> {
        return this.collectionService.getOwners(collection.address);
    }

    @Public()
    @ResolveField(() => SevenDayVolume, {
        description: 'Returns 7 days of volume for given collection.',
        nullable: true,
    })
    async sevenDayVolume(@Parent() collection: Collection): Promise<SevenDayVolume> {
        return this.collectionService.getSevenDayVolume(collection.address);
    }

    @Public()
    @ResolveField(() => GrossEarnings, { description: 'Returns gross earnings for given collection.', nullable: true })
    async grossEarnings(@Parent() collection: Collection): Promise<GrossEarnings> {
        return this.collectionService.getGrossEarnings(collection.address);
    }

    @ResolveField(() => CollectionEarningsChartPaginated, {
        description: 'Returns the earnings chart for given collection.',
        nullable: true,
    })
    async earnings(
        @Parent() collection: Collection,
            @Args('before', { nullable: true }) before?: string,
            @Args('after', { nullable: true }) after?: string,
            @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
            @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number,
    ): Promise<CollectionEarningsChartPaginated> {
        return this.collectionService.getCollectionEarningsChart(collection.address, before, after, first, last);
    }

    @Public()
    @ResolveField(() => AggregatedVolume, {
        description: 'Returns the aggregate data of volume for the given organization.',
    })
    async aggregatedVolumes(@Parent() collection: Collection): Promise<AggregatedVolume> {
        return this.collectionService.getAggregatedVolumes(collection.address);
    }

    @Public()
    @Query(() => [String], { description: 'Return the token ids match the given criteria.' })
    async searchTokenIds(@Args('input', { nullable: true }) input: SearchTokenIdsInput): Promise<string[]> {
        return this.collectionService.searchTokenIds(input);
    }

    @Public()
    @Query(() => MetadataOverview, { description: 'Returns the metadata overview of given collection.' })
    async metadataOverview(@Args('input') input: MetadataOverviewInput): Promise<MetadataOverview> {
        return this.collectionService.getMetadataOverview(input);
    }

    @ResolveField(() => [CollectionPlugin], { description: 'Returns the collection plugins.' })
    async collectionPlugins(@Parent() collection: Collection): Promise<CollectionPlugin[]> {
        return this.collectionService.getCollectionPlugins(collection.id);
    }

    @UseGuards(SigninByEmailGuard)
    @Mutation(() => Collection, { description: 'migrate a collection' })
    async migrateCollection(@Args('input') input: MigrateCollectionInput, @SessionUser() user: User): Promise<Collection> {
        const { tokenAddress, chainId, organizationId } = input;
        const organization = await this.organizationService.getOrganization(organizationId);
        return this.collectionService.migrateCollection(chainId, tokenAddress, user, organization);
    }
}
