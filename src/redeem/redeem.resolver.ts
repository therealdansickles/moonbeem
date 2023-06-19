import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation } from '@nestjs/graphql';

import { Redeem, CreateRedeemInput } from './redeem.dto';
import { RedeemService } from './redeem.service';

@Resolver(() => Redeem)
export class RedeemResolver {
    constructor(private readonly redeemService: RedeemService) {}

    @Mutation(() => Redeem, { description: 'Claim a new redeem.' })
    async createRedeem(@Args('input') input: CreateRedeemInput): Promise<Redeem> {
        return await this.redeemService.createRedeem(input);
    }
}
