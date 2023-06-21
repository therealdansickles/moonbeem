import { UseGuards } from '@nestjs/common';
import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { Public } from '../session/session.decorator';

import { Redeem, CreateRedeemInput } from './redeem.dto';
import { RedeemService } from './redeem.service';

@Resolver(() => Redeem)
export class RedeemResolver {
    constructor(private readonly redeemService: RedeemService) {}

    // TODO: temp make it public for frontend guys to test
    // will add up a auth by address decorator
    // need to be fix before 2023/06/23
    @Public()
    @Mutation(() => Redeem, { description: 'Claim a new redeem.' })
    async createRedeem(@Args('input') input: CreateRedeemInput): Promise<Redeem> {
        return await this.redeemService.createRedeem(input);
    }
}
