import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Public } from '../lib/decorators/public.decorator';
import { Organization, CreateOrganizationInput, UpdateOrganizationInput, DeleteOrganizationInput, TransferOrganizationInput } from './organization.dto';
import { OrganizationService } from './organization.service';

@Resolver('Organization')
export class OrganizationResolver {
    constructor(private readonly organizationService: OrganizationService) {}

    @Public()
    @Query(() => Organization, { description: 'Returns an organization for the given uuid', nullable: true })
    async organization(@Args('id') id: string): Promise<Organization> {
        return await this.organizationService.getOrganization(id);
    }

    @Public()
    @Query(() => Organization, { description: 'Creates an organization.' })
    async createOrganization(@Args('input') input: CreateOrganizationInput): Promise<Organization> {
        return await this.organizationService.createOrganization(input);
    }

    @Public()
    @Query(() => Organization, { description: 'Update an organization.' })
    async updateOrganization(@Args('input') input: UpdateOrganizationInput): Promise<Organization> {
        const { id } = input;
        return await this.organizationService.updateOrganization(id, input);
    }

    @Public()
    @Query(() => Boolean, { description: 'Delete an organization.' })
    async deleteOrganization(@Args('input') input: DeleteOrganizationInput): Promise<boolean> {
        const { id } = input;
        return await this.organizationService.deleteOrganization(id);
    }

    @Public()
    @Query(() => Organization, { description: 'Transfer an organization to another user.' })
    async transferOrganization(@Args('input') input: TransferOrganizationInput): Promise<Organization> {
        const { id, ownerId } = input;
        return await this.organizationService.transferOrganization(id, ownerId);
    }
}
