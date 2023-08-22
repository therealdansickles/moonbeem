import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { SigninByWalletGuard } from '../session/session.guard';
import {
    ClaimWaitlistInput, CreateWaitlistInput, GetWaitlistInput, Waitlist
} from './waitlist.dto';
import { WaitlistService } from './waitlist.service';

@Resolver('Waitlist')
export class WaitlistResolver {
    constructor(private readonly waitlistService: WaitlistService) {}

    @Public()
    @Query(() => Waitlist, { description: 'returns a waitlist for a given email', nullable: true })
    async getWaitlist(@Args('input') input: GetWaitlistInput): Promise<Waitlist> {
        return this.waitlistService.getWaitlist(input);
    }

    @Public()
    @Mutation(() => Waitlist, { description: 'creates a waitlist item' })
    async createWaitlist(@Args('input') input: CreateWaitlistInput): Promise<Waitlist> {
        return this.waitlistService.createWaitlist(input);
    }

    @UseGuards(SigninByWalletGuard)
    @Mutation(() => Boolean, { description: 'claim a waitlist item' })
    async claimWaitlist(@Args('input') input: ClaimWaitlistInput): Promise<boolean> {
        return this.waitlistService.claimWaitlist(input);
    }
}
