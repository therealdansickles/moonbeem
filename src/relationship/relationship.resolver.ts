import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { SigninByWalletGuard } from '../session/session.guard';
import {
    CreateRelationshipByAddressInput, DeleteRelationshipByAddressInput, Relationship
} from './relationship.dto';
import { RelationshipService } from './relationship.service';

@Resolver('Relationship')
export class RelationshipResolver {
    constructor(private readonly relationshipService: RelationshipService) {}

    @Public()
    @Query(() => [Relationship], { description: 'returns followers list for given data.', nullable: true })
    async followers(@Args('address') address: string): Promise<Relationship[]> {
        const relationships = await this.relationshipService.getFollowersByAddress(address);
        return relationships;
    }

    @Public()
    @Query(() => [Relationship], { description: 'returns followings list for given data.', nullable: true })
    async followings(@Args('address') address: string): Promise<Relationship[]> {
        const relationships = await this.relationshipService.getFollowingsByAddress(address);
        return relationships;
    }

    @UseGuards(SigninByWalletGuard)
    @Mutation(() => Relationship, { description: 'create relationship.' })
    async followByAddress(@Args('input') input: CreateRelationshipByAddressInput): Promise<Relationship> {
        return this.relationshipService.createRelationshipByAddress(input);
    }

    @Mutation(() => Boolean, { description: 'create relationship.' })
    async unfollowByAddress(@Args('input') input: DeleteRelationshipByAddressInput): Promise<boolean> {
        return this.relationshipService.deleteRelationshipByAddress(input);
    }
}
