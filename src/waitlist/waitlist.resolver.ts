import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Public } from '../session/session.decorator';

import { WaitlistService } from './waitlist.service';
import {
    CreateWaitlistInput,
    GetWaitlistInput,
    Waitlist,
    ClaimWaitlistInput,
    ClaimProfileInput,
    ClaimProfileResult,
} from './waitlist.dto';

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

    @Public()
    @Mutation(() => Boolean, { description: 'claim a waitlist item' })
    async claimWaitlist(@Args('input') input: ClaimWaitlistInput): Promise<boolean> {
        return this.waitlistService.claimWaitlist(input);
    }
}
