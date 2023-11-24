import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ReferralService } from './referral.service';
import { CreateReferralInput, Referral } from './referral.dto';
import { GraphQLError } from 'graphql';

@Resolver(() => Referral)
export class ReferralResolver {

    constructor(private readonly referralService: ReferralService) {
    }

    @Mutation(() => Referral)
    async createReferral(@Args('input') referral: CreateReferralInput): Promise<Referral> {
        const { collectionId, referralCode, count } = referral;
        try {
            await this.referralService.updateNftReferralCount(collectionId, referralCode, count);
        } catch (e) {
            throw new GraphQLError('Invalid referral code', {
                extensions: { code: 'BAD_REQUEST' },
            });
        }
        return this.referralService.createReferral(referral);
    }
}
