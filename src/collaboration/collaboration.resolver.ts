import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { SigninByEmailGuard } from '../session/session.guard';
import { Collaboration, CreateCollaborationInput } from './collaboration.dto';
import { CollaborationService } from './collaboration.service';

@Resolver(() => Collaboration)
export class CollaborationResolver {
    constructor(private readonly collaborationService: CollaborationService) {}

    @Public()
    @Query(() => Collaboration, { description: 'returns a collaboration for a given uuid', nullable: true })
    async collaboration(@Args('id') id: string): Promise<Collaboration> {
        return await this.collaborationService.getCollaboration(id);
    }

    @Public()
    @Query(() => [Collaboration], { description: 'returns all collaborations for a given user and organization' })
    async collaborations(
        @Args('userId') userId: string,
        @Args('organizationId') organizationId: string
    ): Promise<Collaboration[]> {
        return await this.collaborationService.getCollaborationsByUserIdAndOrganizationId(userId, organizationId);
    }

    @UseGuards(SigninByEmailGuard)
    @Mutation(() => Collaboration, { description: 'create a collaboration' })
    async createCollaboration(@Args('input') input: CreateCollaborationInput): Promise<Collaboration> {
        return await this.collaborationService.createCollaboration(input);
    }
}
