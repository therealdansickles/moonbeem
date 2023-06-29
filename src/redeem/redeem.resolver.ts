import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { AuthorizedToken } from '../session/session.decorator';
import { SignatureGuard } from '../session/session.guard';

import { Redeem, CreateRedeemInput } from './redeem.dto';
import { RedeemService } from './redeem.service';

@Resolver(() => Redeem)
export class RedeemResolver {
    constructor(private readonly redeemService: RedeemService) {}

    @UseGuards(SignatureGuard)
    @AuthorizedToken({ token: 'tokenId', collection: 'collection.id', owner: 'address' })
    @Mutation(() => Redeem, { description: 'Claim a new redeem.' })
    async createRedeem(@Args('input') input: CreateRedeemInput): Promise<Redeem> {
        return await this.redeemService.createRedeem(input);
    }
}
