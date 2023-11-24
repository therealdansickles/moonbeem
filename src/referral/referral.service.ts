import { InjectRepository } from '@nestjs/typeorm';
import { Referral } from './referral.entity';
import { Repository } from 'typeorm';
import { CreateReferralInput } from './referral.dto';
import { NftService } from '../nft/nft.service';
import { Nft } from '../nft/nft.entity';

export class ReferralService {
    constructor(
        @InjectRepository(Referral)
        private readonly referralRepository: Repository<Referral>,
        private readonly nftService: NftService,
    ) {
    }

    async createReferral(referral: CreateReferralInput): Promise<Referral> {
        return await this.referralRepository.save(referral);
    }

    async updateNftReferralCount(collectionId: string, referralCode: string, count: number): Promise<Nft> {
        const nftIds = await this.nftService.getNftsIdsByProperties(collectionId, [{
            name: 'referral_code',
            value: referralCode
        }]);
        if (nftIds.length === 0) {
            throw new Error('Invalid referral code');
        }
        const tokenId = nftIds[0];
        const nft = await this.nftService.getNft({
            collection: {
                id: collectionId
            }, tokenId
        });
        nft.properties.referral_count.value = parseInt(nft.properties.referral_count.value.toString()) + count;

        return this.nftService.createOrUpdateNftByTokenId({
            collectionId: nft.collection.id,
            tierId: nft.tier.id,
            tokenId: nft.tokenId,
            properties: nft.properties,
        });
    }

    async getReferralsByReferralCode(referralCode: string): Promise<Referral[]> {
        return this.referralRepository.findBy({ referralCode });
    }
}
