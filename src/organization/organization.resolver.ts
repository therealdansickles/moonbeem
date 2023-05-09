import { Resolver, Query, Args, Mutation, ResolveField, Parent } from '@nestjs/graphql';
import { Public } from '../lib/decorators/public.decorator';
import {
    Organization,
    CreateOrganizationInput,
    UpdateOrganizationInput,
    DeleteOrganizationInput,
    TransferOrganizationInput,
} from './organization.dto';
import { OrganizationService } from './organization.service';
import { Collaboration } from '../collaboration/collaboration.dto';
import { CollaborationService } from '../collaboration/collaboration.service';
import { Collection } from '../collection/collection.dto';
import { CollectionService } from '../collection/collection.service';
import { Membership } from '../membership/membership.dto';
import { MembershipService } from '../membership/membership.service';

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

    @Public()
    @Mutation(() => Organization, { description: 'Creates an organization.' })
    async createOrganization(@Args('input') input: CreateOrganizationInput): Promise<Organization> {
        return await this.organizationService.createOrganization(input);
    }

    @Public()
    @Mutation(() => Organization, { description: 'Update an organization.' })
    async updateOrganization(@Args('input') input: UpdateOrganizationInput): Promise<Organization> {
        const { id } = input;
        return await this.organizationService.updateOrganization(id, input);
    }

    @Public()
    @Mutation(() => Boolean, { description: 'Delete an organization.' })
    async deleteOrganization(@Args('input') input: DeleteOrganizationInput): Promise<boolean> {
        const { id } = input;
        return await this.organizationService.deleteOrganization(id);
    }

    @Public()
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
}
