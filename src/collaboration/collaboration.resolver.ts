import { Public } from '../lib/decorators/public.decorator';
import { Resolver, Query, Args, Mutation, ResolveField, Parent } from '@nestjs/graphql';

import { Collaboration, CreateCollaborationInput } from './collaboration.dto';
import { CollaborationService } from './collaboration.service';

@Resolver(() => Collaboration)
export class CollaborationResolver {
    constructor(private readonly collaborationService: CollaborationService) {}

    @Public()
    @Query(() => Collaboration, { description: 'returns a collaboration for a given uuid', nullable: true })
    async collaboration(@Args('id') id: string): Promise<Collaboration> {
        return this.collaborationService.getCollaboration(id);
    }

    @Public()
    @Mutation(() => Collaboration, { description: 'create a collaboration' })
    async createCollaboration(@Args('input') input: CreateCollaborationInput): Promise<Collaboration> {
        return this.collaborationService.createCollaboration(input);
    }
}
