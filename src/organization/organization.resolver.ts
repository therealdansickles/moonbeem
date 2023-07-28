import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';

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
    CreateOrganizationInput,
    Organization,
    OrganizationInput,
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
}
