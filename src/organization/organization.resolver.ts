import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { Collaboration } from '../collaboration/collaboration.dto';
import { CollaborationService } from '../collaboration/collaboration.service';
import { Collection } from '../collection/collection.dto';
import { CollectionService } from '../collection/collection.service';
import { Membership } from '../membership/membership.dto';
import { MembershipService } from '../membership/membership.service';
import { Public } from '../session/session.decorator';
import { SigninByEmailGuard } from '../session/session.guard';
import {
    AggregatedBuyer,
    AggregatedCollection,
    AggregatedEarning,
    CollectionStatFromOrganization,
    CreateOrganizationInput,
    Organization,
    OrganizationInput,
    OrganizationLatestSalePaginated,
    OrganizationProfit,
    TransferOrganizationInput,
    UpdateOrganizationInput,
} from './organization.dto';
import { OrganizationService } from './organization.service';

@Resolver(() => Organization)
export class OrganizationResolver {
    constructor(
        private readonly collectionService: CollectionService,
        private readonly collaborationService: CollaborationService,
        private readonly membershipService: MembershipService,
        private readonly organizationService: OrganizationService
    ) {}

    @Public()
    @Query(() => Organization, { description: 'Returns an organization for the given uuid', nullable: true })
    async organization(@Args('id') id: string): Promise<Organization> {
        return await this.organizationService.getOrganization(id);
    }

    @UseGuards(SigninByEmailGuard)
    @Mutation(() => Organization, { description: 'Creates an organization.' })
    async createOrganization(@Args('input') input: CreateOrganizationInput): Promise<Organization> {
        return await this.organizationService.createOrganization(input);
    }

    @Mutation(() => Organization, { description: 'Update an organization.' })
    async updateOrganization(@Args('input') input: UpdateOrganizationInput): Promise<Organization> {
        const { id } = input;
        return await this.organizationService.updateOrganization(id, input);
    }

    @Mutation(() => Boolean, { description: 'Delete an organization.' })
    async deleteOrganization(@Args('input') input: OrganizationInput): Promise<boolean> {
        const { id } = input;
        return await this.organizationService.deleteOrganization(id);
    }

    @Mutation(() => Organization, { description: 'Transfer an organization to another user.' })
    async transferOrganization(@Args('input') input: TransferOrganizationInput): Promise<Organization> {
        const { id, ownerId } = input;
        return await this.organizationService.transferOrganization(id, ownerId);
    }

    @Public()
    @ResolveField(() => [Collection], { description: 'Returns the collections for the given organization' })
    async collections(@Parent() organization: Organization): Promise<Collection[]> {
        return await this.collectionService.getCollectionsByOrganizationId(organization.id);
    }

    @Public()
    @ResolveField(() => [Membership], { description: 'Returns the members for the given organization' })
    async memberships(@Parent() organization: Organization): Promise<Membership[]> {
        return await this.membershipService.getMembershipsByOrganizationId(organization.id);
    }

    @Public()
    @ResolveField(() => [Collaboration], { description: 'Returns the members for the given organization' })
    async collaborations(@Parent() organization: Organization): Promise<Collaboration[]> {
        return await this.collaborationService.getCollaborationsByOrganizationId(organization.id);
    }

    @Public()
    @ResolveField(() => AggregatedCollection, {
        description: 'Returns the aggregate data of collections for given organization',
    })
    async aggregatedCollection(@Parent() organization: Organization): Promise<AggregatedCollection> {
        return await this.collectionService.getAggregatedCollectionsByOrganizationId(organization.id);
    }

    @Public()
    @ResolveField(() => AggregatedBuyer, {
        description: 'Returns the aggregate data of buyers for the given organization.',
    })
    async aggregatedBuyer(@Parent() organization: Organization): Promise<AggregatedBuyer> {
        return await this.organizationService.getAggregatedBuyers(organization.id);
    }

    @Public()
    @ResolveField(() => AggregatedEarning, { description: 'Returns the aggregate data of earngin for given wallet' })
    async aggregatedEarning(@Parent() organization: Organization): Promise<AggregatedEarning> {
        return await this.organizationService.getAggregatedEarnings(organization.id);
    }

    @Public()
    @ResolveField(() => [OrganizationProfit], { description: 'Returns the total raised for the given organization.' })
    async profit(@Parent() organization: Organization): Promise<OrganizationProfit[]> {
        return await this.organizationService.getOrganizationProfit(organization.id);
    }

    @Public()
    @ResolveField(() => Int, { description: 'Returns the total collections for the given organization.' })
    async totalCollections(@Parent() organization: Organization): Promise<number> {
        return await this.organizationService.getTotalCollections(organization.id);
    }

    @Public()
    @ResolveField(() => Int, { description: 'Returns the total sold for the given organization.' })
    async itemSold(@Parent() organization: Organization): Promise<number> {
        return await this.organizationService.getItemSold(organization.id);
    }

    @Public()
    @ResolveField(() => Int, { description: 'Returns the unique buyers for the given organization.' })
    async uniqueBuyers(@Parent() organization: Organization): Promise<number> {
        return await this.organizationService.getUniqueBuyers(organization.id);
    }

    @Public()
    @ResolveField(() => OrganizationLatestSalePaginated, {
        description: 'Returns the latest sales list for the given organization.',
    })
    async latestSales(
        @Parent() organization: Organization,
            @Args('before', { nullable: true }) before?: string,
            @Args('after', { nullable: true }) after?: string,
            @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
            @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number
    ): Promise<OrganizationLatestSalePaginated> {
        return await this.organizationService.getLatestSales(organization.id, before, after, first, last);
    }

    @Public()
    @ResolveField(() => CollectionStatFromOrganization, {
        description: 'Returns the collection stat for given organization.',
    })
    async collectionStat(@Parent() organization: Organization): Promise<CollectionStatFromOrganization> {
        return await this.organizationService.getCollectionStat(organization.id);
    }
}
