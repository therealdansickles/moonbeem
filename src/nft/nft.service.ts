import { pick } from 'lodash';
import { render } from 'mustache';
import { In, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Metadata } from '../metadata/metadata.dto';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
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

export type INftWithPropertyAndCollection = {
    collection: { id: string };
    propertyName: string;
}

@Injectable()
export class NftService {
    constructor(
        private readonly asset721Service: Asset721Service,
        @InjectRepository(Nft) private readonly nftRepository: Repository<Nft>
    ) {}

    /**
     * render metadata
     * 
     * @param id
     * @param tier
     */
    renderMetadata(nft: Nft) {
        const result: NftDto = Object.assign({}, nft);
        if (nft?.properties && nft?.tier?.metadata) {
            const properties = Object.keys(nft.properties).reduce((accu, key) => { 
                accu[key] = nft.properties[key]?.value;
                return accu;
            }, {});
            const alias = nft.tier.metadata.configs?.alias || {};
            const allValues = Object.assign(alias, properties);
            const metadata = JSON.parse(render(JSON.stringify(nft.tier.metadata), allValues));
            // if some property.name is empty, then use the key as default
            for (const key in (metadata as Metadata).properties) {
                if (metadata.properties[key].name === '') metadata.properties[key].name = key;
            }
            result.metadata = metadata;
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
     * get NFTs contains specific property
     * 
     * @param query
     * @returns
     */
    async getNftByProperty(query: INftWithPropertyAndCollection) {
        let nfts = await this.nftRepository.createQueryBuilder('nft')
            .leftJoinAndSelect('nft.collection', 'collection')
            .leftJoinAndSelect('nft.tier', 'tier')
            .andWhere('collection.id = :collectionId', { collectionId: query.collection.id })
            .andWhere(`properties->>'${query.propertyName}' IS NOT NULL`)
            .orderBy(`CAST(REGEXP_REPLACE(properties->'${query.propertyName}'->>'value', 'N/A', '0') AS NUMERIC)`, 'DESC')
            .getMany();
        if (nfts.length > 0) {
            const assets = await this.asset721Service.getAssets(nfts[0].collection.tokenAddress);
            const ownerMapping = assets.reduce((accu, asset) => {
                accu.set(asset.tokenId, asset.owner);
                return accu;
            }, new Map<string, string>());

            nfts = nfts.map(nft => {
                (nft as NftDto).owner = ownerMapping.get(nft.tokenId);
                return nft;
            });
        }
        return nfts;
    }

    async getOverviewByCollectionAndProperty(query: INftWithPropertyAndCollection) {
        return await this.nftRepository.createQueryBuilder('nft')
            .leftJoinAndSelect('nft.collection', 'collection')
            .andWhere('collection.id = :collectionId', { collectionId: query.collection.id })
            .select(`MAX(CAST(properties->'${query.propertyName}'->>'value' AS NUMERIC))`, 'max')
            .addSelect(`MIN(CAST(properties->'${query.propertyName}'->>'value' AS NUMERIC))`, 'min')
            .addSelect(`ROUND(AVG(CAST(properties->'${query.propertyName}'->>'value' AS NUMERIC)), 2)`, 'avg')
            .andWhere(`properties->>'${query.propertyName}' IS NOT NULL`)
            .andWhere(`properties->'${query.propertyName}'->>'value' != 'N/A'`)
            .getRawOne();
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
