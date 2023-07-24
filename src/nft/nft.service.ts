import { omit } from 'lodash';
import { In, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Nft } from './nft.entity';

export type INftQuery = {
    id?: string;
    collection?: { id: string };
    tier?: { id: string };
    tokenId?: number;
};

export type INftListQuery = {
    collection?: { id: string };
    tier?: { id: string };
    tokenIds?: number[];
    tokenId?: any;
};

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
     * get NFTs by query
     * @param query
     * @returns
     */
    async getNftListByQuery(query: INftListQuery) {
        if (query.tokenIds) {
            query.tokenId = In([...query.tokenIds]);
            query = omit(query, 'tokenIds');
        }

        return await this.nftRepository.findBy(query);
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
            properties,
        });
    }
}
