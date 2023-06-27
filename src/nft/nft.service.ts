import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nft } from './nft.entity';

@Injectable()
export class NftService {
    constructor(@InjectRepository(Nft) private readonly nftRepository: Repository<Nft>) {}

    /**
     * get nft info
     * 
     * @param id
     * @returns
     */
    async getNft(id: string) {
        return await this.nftRepository.findOneBy({ id });
    }


    /**
     * create or update NFT info
     * 
     * @param collectionId
     * @param tierId
     * @param tokenId
     * @param properties
     * @returns
     */
    async createOrUpdateNftByTokenId({ collectionId, tierId, tokenId, properties }) {
        return await this.nftRepository.save({ 
            tokenId,
            collection: { id: collectionId },
            tier: { id: tierId },
            properties
        });
    }
}