import { pick } from 'lodash';
import { render } from 'mustache';
import { In, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Nft as NftDto } from './nft.dto';
import { Nft } from './nft.entity';

export type INftQuery = 
    | { id: string }
    | { collection: { id: string }, tokenId: string; }
    | { tier: { id: string }, tokenId: string };

interface INftListQueryWithIds {
    ids: string[];
}

interface INftListQueryWithCollection {
    collection: { id: string };
    tokenIds?: string[];
}

interface INftListQueryWithTier {
    tier: { id: string };
    tokenIds?: string[];
}


export type INftListQuery = 
    | INftListQueryWithIds
    | INftListQueryWithCollection
    | INftListQueryWithTier

@Injectable()
export class NftService {
    constructor(@InjectRepository(Nft) private readonly nftRepository: Repository<Nft>) {}

    /**
     * render metadata
     * 
     * @param id
     * @param tier
     */
    renderMetadata(nft: Nft) {
        const result: NftDto = Object.assign({}, nft);
        if (nft.properties && nft.tier.metadata) {
            const metadata = render(JSON.stringify(nft.tier.metadata), nft.properties, {}, ['{{', '}}']);
            result.metadata = JSON.parse(metadata);
        }
        return result;
    }

    /**
     * get NFT info by the id
     *
     * @param id
     * @returns
     */
    async getNft(query: INftQuery) {
        const nft = await this.nftRepository.findOne({ where: query, relations: ['collection', 'tier'] });
        return this.renderMetadata(nft);
    }

    /**
     * @deprecated
     * get NFT info by criteria, just use `getNft` function
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
    async getNfts(query: INftListQuery) {
        const where = pick(query, ['collection', 'tier']);
        if ((query as INftListQueryWithIds).ids) where.id = In([...(query as INftListQueryWithIds).ids]);
        if ((query as INftListQueryWithCollection | INftListQueryWithTier).tokenIds) where.tokenId = In([...(query as INftListQueryWithCollection | INftListQueryWithTier).tokenIds]);

        return await this.nftRepository.findBy(where);
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
        await this.nftRepository.upsert({
            tokenId,
            collection: { id: collectionId },
            tier: { id: tierId },
            properties,
        }, ['collection.id', 'tier.id', 'tokenId']);
        return this.nftRepository.findOneBy({ collection: { id: collectionId }, tier: { id: tierId }, tokenId });
    }
}
