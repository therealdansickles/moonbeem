import { InjectRepository } from '@nestjs/typeorm';
import { Referral } from './referral.entity';
import { Repository } from 'typeorm';
import { CreateReferralInput } from './referral.dto';

export class ReferralService {
    constructor(
        @InjectRepository(Referral)
        private readonly referralRepository: Repository<Referral>,
    ) {
    }

    async createReferral(referral: CreateReferralInput): Promise<Referral> {
        return this.referralRepository.save(referral);
    }

    async getReferralsByReferralCode(referralCode: string): Promise<Referral[]> {
        return this.referralRepository.findBy({ referralCode });
    }
}
