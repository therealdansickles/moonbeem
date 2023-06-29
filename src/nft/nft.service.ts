import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Nft } from './nft.entity';

export type INftQuery = {
    id?: string,
    collection?: { id: string },
    tier?: { id: string },
    tokenId?: number,
}

@Injectable()
export class NftService {
    constructor(@InjectRepository(Nft) private readonly nftRepository: Repository<Nft>) {}

    /**
     * get NFT info by the id
     * 
     * @param id
     * @returns
     */
    async getNft(id: string) {
        return await this.nftRepository.findOneBy({ id });
    }

    /**
     * get NFT info by criteria
     * 
     * @param query
     * @returns
     */
    async getNftByQuery(query: INftQuery) {
        return await this.nftRepository.findOneBy(query);
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