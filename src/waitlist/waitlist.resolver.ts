import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { Public } from '../lib/decorators/public.decorator';

import { WaitlistService } from './waitlist.service';
import { CreateWaitlistInput, Waitlist } from './waitlist.dto';

@Resolver('Waitlist')
export class WaitlistResolver {
    constructor(private readonly waitlistService: WaitlistService) {}

    @Public()
    @Query(() => Waitlist, { description: 'returns a waitlist for a given email', nullable: true })
    async getWaitlist(@Args('email') email: string): Promise<Waitlist> {
        return this.waitlistService.getWaitlist(email);
    }

    @Public()
    @Mutation(() => Waitlist, { description: 'creates a waitlist item' })
    async createWaitlist(@Args('input') input: CreateWaitlistInput): Promise<Waitlist> {
        return this.waitlistService.createWaitlist(input);
    }
}
