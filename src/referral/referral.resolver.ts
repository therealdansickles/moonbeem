import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ReferralService } from './referral.service';
import { CreateReferralInput, Referral } from './referral.dto';

@Resolver(() => Referral)
export class ReferralResolver {

    constructor(private readonly referralService: ReferralService) {
    }

    @Mutation(() => Referral)
    async createReferral(@Args('input') referral: CreateReferralInput): Promise<Referral> {
        return this.referralService.createReferral(referral);
    }
}
