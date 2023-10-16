import { isBoolean } from 'lodash';

import { UseGuards } from '@nestjs/common';
import { Args, Int, Mutation, Query, Resolver } from '@nestjs/graphql';

import { AuthorizedToken, Public } from '../session/session.decorator';
import { SignatureGuard } from '../session/session.guard';
import { CreateRedeemInput, Redeem } from './redeem.dto';
import { IRedeemListQuery, RedeemService } from './redeem.service';

@Resolver(() => Redeem)
export class RedeemResolver {
    constructor(private readonly redeemService: RedeemService) {}

    @Public()
    @Query(() => Redeem, { description: 'Get a redeem by id.', nullable: true })
    async redeem(@Args('id') id: string) {
        return await this.redeemService.getRedeem(id);
    }

    @Public()
    @Query(() => Redeem, { description: 'Get a redeem by query.', nullable: true })
    async getRedeemByQuery(@Args('collectionId') collectionId: string, @Args({ type: () => Int, name: 'tokenId' }) tokenId: number) {
        return await this.redeemService.getRedeemByQuery({ collection: { id: collectionId }, tokenId });
    }

    @Public()
    async getRedeems(
    @Args('collectionId') collectionId: string,
        @Args('address') address: string,
        @Args({ name: 'isRedeemed', type: Boolean, nullable: true }) isRedeemed?: boolean,
    ) {
        const query: IRedeemListQuery = { collection: { id: collectionId }, address };
        if (isBoolean(isRedeemed)) query.isRedeemed = isRedeemed;
        return await this.redeemService.getRedeems(query);
    }

    @Public()
    @UseGuards(SignatureGuard)
    @AuthorizedToken({ token: 'tokenId', collection: 'collection.id', owner: 'address' })
    @Mutation(() => Redeem, { description: 'Claim a new redeem.' })
    async createRedeem(@Args('input') input: CreateRedeemInput): Promise<Redeem> {
        return await this.redeemService.createRedeem(input);
    }
}
