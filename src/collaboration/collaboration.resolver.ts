import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, ResolveField, Parent } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { SigninByEmailGuard } from '../session/session.guard';
import { Collaboration, CreateCollaborationInput, CollaborationWithEarnings } from './collaboration.dto';
import { CollaborationService } from './collaboration.service';
import { Collection } from '../collection/collection.dto';
import { CollectionService } from '../collection/collection.service';

@Resolver(() => Collaboration)
export class CollaborationResolver {
    constructor(
        private readonly collaborationService: CollaborationService, 
        private readonly collectionService: CollectionService
    ) {}

    @Public()
    @Query(() => CollaborationWithEarnings, { description: 'returns a collaboration for a given uuid', nullable: true })
    async collaboration(@Args('id') id: string): Promise<CollaborationWithEarnings> {
        return await this.collaborationService.getCollaborationWithEarnings(id);
    }

    @ResolveField(() => [Collection], { nullable: 'itemsAndList' })
    async collections(@Parent() collaboration: Collaboration): Promise<Collection[]> {
        return await this.collectionService.getCollectionsByCollaborationId(collaboration.id);
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
