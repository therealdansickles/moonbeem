import { Network } from 'alchemy-sdk';
import { intersection, isEmpty, isNil, merge } from 'lodash';
import { render } from 'mustache';
import { In, Repository } from 'typeorm';
import { v4 } from 'uuid';

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { AlchemyService } from '../alchemy/alchemy.service';
import { PropertyFilter } from '../collection/collection.dto';
import { Collection, CollectionKind } from '../collection/collection.entity';
import { MerkleTree } from '../merkleTree/merkleTree.entity';
import { Metadata, MetadataProperties } from '../metadata/metadata.dto';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { TierService } from '../tier/tier.service';
import { Nft as NftDto, NftPaginated, UpdateNftPropertiesInput } from './nft.dto';
import { Nft } from './nft.entity';
import { PaginationInput } from '../pagination/pagination.dto';
import { cursorToStrings, toPaginated } from '../pagination/pagination.utils';
import { MaasService } from '../maas/maas.service';

interface INFTQueryWithId {
    id: string;
}

interface INftQueryWithCollection {
    collection: { id: string };
    tokenId: string;
}

interface INftQueryWithTier {
    tier: { id: string };
    tokenId: string;
}

export type INftQuery = INFTQueryWithId | INftQueryWithCollection | INftQueryWithTier;

interface INftPropertiesSearch {
    name: string;
    value?: any;
    min?: number;
    max?: number;
}

interface INftListQueryWithIds {
    ids: string[];
    properties?: Array<INftPropertiesSearch>;
    plugins?: Array<string>;
}

interface INftListQueryWithCollection {
    collection: { id: string };
    tokenIds?: string[];
    properties?: Array<INftPropertiesSearch>;
    ownerAddress?: string;
    plugins?: Array<string>;
}

interface INftListQueryWithTier {
    tier: { id: string };
    tokenIds?: string[];
    properties?: Array<INftPropertiesSearch>;
    ownerAddress?: string;
    plugins?: Array<string>;
}

export type INftListQuery = INftListQueryWithIds | INftListQueryWithCollection | INftListQueryWithTier;

export type INftWithPropertyAndCollection = {
    collection: { id: string };
    propertyName: string;
};

export type ICreateOrUpdateNft = {
    collectionId: string;
    tierId: string;
    tokenId: string;
    ownerAddress?: string;
    properties: any;
    image?: string;
};

@Injectable()
export class NftService {
    constructor(
        @InjectRepository(Nft)
        private readonly nftRepository: Repository<Nft>,
        @InjectRepository(Collection)
        private readonly collectionRepository: Repository<Collection>,
        @InjectRepository(MerkleTree)
        private readonly merkleTreeRepository: Repository<MerkleTree>,
        @Inject(forwardRef(() => AlchemyService))
        private alchemyService: AlchemyService,
        private readonly asset721Service: Asset721Service,
        private readonly tierService: TierService,
        private readonly maasService: MaasService,
    ) {
    }

    /**
     * render metadata
     *
     * @param id
     * @param tier
     */
    renderMetadata(nft: Nft): NftDto {
        const result: NftDto = merge({}, nft);
        if (nft?.properties && nft?.tier?.metadata) {
            const nftProperties = nft.properties;
            const properties = Object.keys(nftProperties).reduce((accu, key) => {
                accu[key] = nftProperties[key]?.value;
                return accu;
            }, {});
            const alias = nft.tier.metadata.configs?.alias || {};
            const allValues = merge(alias, properties);
            // merge the properties from tier and nft
            const mergedMetadata = merge({}, nft.tier.metadata, { properties: nftProperties });
            const metadata = JSON.parse(render(JSON.stringify(mergedMetadata), allValues));
            // if some property.name is empty, then use the key as default
            for (const key in (metadata as Metadata).properties) {
                if (metadata.properties[key].name === '') metadata.properties[key].name = key;
            }

            // attach image on metadata with the priority below
            // 1. NFT's own image property
            // 2. `image` attribute on tier
            // 3. none
            if (nft.image) {
                metadata.image = nft.image;
            } else if (nftProperties.image && nftProperties.image.value) {
                metadata.image = nftProperties.image.value;
            } else if (nft.tier?.image) {
                metadata.image = nft.tier.image;
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
        if (nft) return await this.renderMetadata(nft);
        return null;
    }

    /**
     * get NFTs contains specific property
     *
     * @param query
     * @returns
     */
    async getNftByProperty(query: INftWithPropertyAndCollection) {
        let nfts = await this.nftRepository
            .createQueryBuilder('nft')
            .leftJoinAndSelect('nft.collection', 'collection')
            .leftJoinAndSelect('nft.tier', 'tier')
            .andWhere('collection.id = :collectionId', { collectionId: query.collection.id })
            .andWhere(`properties->>'${query.propertyName}' IS NOT NULL`)
            .orderBy(
                `CAST(REGEXP_REPLACE(properties->'${query.propertyName}'->>'value', 'N/A', '0') AS NUMERIC)`, 'DESC')
            .getMany();
        if (nfts.length > 0) {
            const assets = await this.asset721Service.getAssets(nfts[0].collection.tokenAddress);
            const ownerMapping = assets.reduce((accu, asset) => {
                accu.set(asset.tokenId, asset.owner);
                return accu;
            }, new Map<string, string>());

            nfts = nfts.map((nft) => {
                (nft as NftDto).owner = ownerMapping.get(nft.tokenId);
                return nft;
            });
        }
        return nfts;
    }

    /**
     * get NFT metadata overview
     *
     * @param query
     * @returns
     */
    async getOverviewByCollectionAndProperty(query: INftWithPropertyAndCollection) {
        return await this.nftRepository
            .createQueryBuilder('nft')
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
    async getNfts(query: INftListQuery): Promise<NftDto[]> {
        const builder = this.nftRepository
            .createQueryBuilder('nft')
            .leftJoinAndSelect('nft.collection', 'collection')
            .leftJoinAndSelect('nft.tier', 'tier');
        let tokenIds = [];
        if ((query as INftListQueryWithCollection | INftListQueryWithTier).ownerAddress) {
            builder.andWhere('nft.ownerAddress = :ownerAddress', {
                ownerAddress: (query as INftListQueryWithCollection | INftListQueryWithTier).ownerAddress,
            });
        }
        if (query.plugins && query.plugins.length > 0) {
            tokenIds = await this.getNftsIdsByPlugins(query.plugins);
        }
        if ((query as INftListQueryWithIds).ids) builder.andWhere(
            'id IN(:...ids)', { ids: (query as INftListQueryWithIds).ids });
        if ((query as INftListQueryWithCollection | INftListQueryWithTier).tokenIds) {
            const tokenIdsFromFilter = (query as INftListQueryWithCollection | INftListQueryWithTier).tokenIds.map(
                (id) => parseInt(id));
            tokenIds = tokenIds.length > 0 ? intersection(tokenIds, tokenIdsFromFilter) : tokenIdsFromFilter;
        }
        if (tokenIds.length > 0) {
            builder.andWhere('nft.tokenId IN(:...tokenIds)', { tokenIds });
        }
        if ((query as INftListQueryWithCollection).collection?.id) {
            builder.andWhere(
                'nft.collection.id = :collectionId',
                { collectionId: (query as INftListQueryWithCollection).collection.id }
            );
        }
        if ((query as INftListQueryWithTier).tier?.id) {
            builder.andWhere('nft.tier.id = :tierId', { tierId: (query as INftListQueryWithTier).tier.id });
        }
        if (query.properties) {
            for (const condition of query.properties) {
                const { name, value, min, max } = condition;
                if (value) {
                    builder.andWhere(`nft.properties->'${name}'->>'value'='${value}'`);
                }
                if (min) {
                    builder.andWhere(`(nft.properties->'${name}'->>'value')::NUMERIC>=${min}`);
                }
                if (max) {
                    builder.andWhere(`(nft.properties->'${name}'->>'value')::NUMERIC<=${max}`);
                }
            }
        }
        const result = await builder.getMany();

        const collections = await this.collectionRepository.find({
            where: {
                id: In([
                    ...new Set(
                        result.map((item) => {
                            return item.collection.id;
                        }),
                    ),
                ]),
            },
            relations: { creator: true },
        });

        const nfts = result.map((item) => {
            item.collection = collections.find((collection) => {
                return item.collection.id == collection.id;
            });
            return item;
        });

        if (nfts && nfts.length > 0) return nfts.map((nft) => this.renderMetadata(nft));
        return null;
    }

    async getNftsPaginated(query: INftListQuery, pagination: PaginationInput): Promise<NftPaginated> {
        const builder = this.nftRepository
            .createQueryBuilder('nft')
            .leftJoinAndSelect('nft.collection', 'collection')
            .leftJoinAndSelect('nft.tier', 'tier');
        let tokenIds = [];
        if ((query as INftListQueryWithCollection | INftListQueryWithTier).ownerAddress) {
            builder.andWhere('nft.ownerAddress = :ownerAddress', {
                ownerAddress: (query as INftListQueryWithCollection | INftListQueryWithTier).ownerAddress,
            });
        }
        if (query.plugins && query.plugins.length > 0) {
            tokenIds = await this.getNftsIdsByPlugins(query.plugins);
        }
        if ((query as INftListQueryWithIds).ids) builder.andWhere(
            'id IN(:...ids)', { ids: (query as INftListQueryWithIds).ids });
        if ((query as INftListQueryWithCollection | INftListQueryWithTier).tokenIds) {
            const tokenIdsFromFilter = (query as INftListQueryWithCollection | INftListQueryWithTier).tokenIds.map(
                (id) => parseInt(id));
            tokenIds = tokenIds.length > 0 ? intersection(tokenIds, tokenIdsFromFilter) : tokenIdsFromFilter;
        }
        if (tokenIds.length > 0) {
            builder.andWhere('nft.tokenId IN(:...tokenIds)', { tokenIds });
        }
        if ((query as INftListQueryWithCollection).collection?.id) {
            builder.andWhere(
                'nft.collection.id = :collectionId',
                { collectionId: (query as INftListQueryWithCollection).collection.id }
            );
        }
        if ((query as INftListQueryWithTier).tier?.id) {
            builder.andWhere('nft.tier.id = :tierId', { tierId: (query as INftListQueryWithTier).tier.id });
        }
        if (query.properties) {
            for (const condition of query.properties) {
                const { name, value, min, max } = condition;
                if (value) {
                    builder.andWhere(`nft.properties->'${name}'->>'value'='${value}'`);
                }
                if (min) {
                    builder.andWhere(`(nft.properties->'${name}'->>'value')::NUMERIC>=${min}`);
                }
                if (max) {
                    builder.andWhere(`(nft.properties->'${name}'->>'value')::NUMERIC<=${max}`);
                }
            }
        }
        const { before, after, first, last } = pagination || {
            first: 10,
        };
        const totalCount = await builder.getCount();
        if (after) {
            const [createdAt, id] = cursorToStrings(after);
            builder.andWhere('nft.createdAt < :createdAt', { createdAt });
            builder.orWhere('nft.createdAt = :createdAt AND nft.id < :id', { createdAt, id });
            builder.orderBy('nft.createdAt', 'DESC');
            builder.addOrderBy('nft.id', 'DESC');
            builder.limit(first);
        } else if (before) {
            const [createdAt, id] = cursorToStrings(before);
            builder.andWhere('nft.createdAt > :createdAt', { createdAt });
            builder.orWhere('nft.createdAt = :createdAt AND nft.id > :id', { createdAt, id });
            builder.orderBy('nft.createdAt', 'ASC');
            builder.addOrderBy('nft.id', 'ASC');
            builder.limit(last);
        } else {
            const limit = first || last || 10;
            builder.orderBy('nft.createdAt', 'DESC');
            builder.addOrderBy('nft.id', 'DESC');
            builder.limit(limit);
        }
        const nfts = await builder.getMany();
        const paginated = toPaginated(
            nfts.map((nft) => this.renderMetadata(nft)),
            totalCount,
        );
        return paginated;
    }

    /**
     * get all user minted NFTs from Alchemy
     *
     * @param network
     * @param ownerAddress
     */
    async getNftsFromExtenal(network: Network, ownerAddress: string) {
        const { ownedNfts: nfts } = await this.alchemyService.getNftsForOwnerAddress(network, ownerAddress);
        return (nfts || []).reduce((accu, rawNft) => {
            const nft = {
                // fake uuid
                id: v4(),
                address: rawNft.contract.address,
                tokenAddress: rawNft.contract.address,
                tokenId: rawNft.tokenId,
                ownerAddress,
                tier: {
                    name: rawNft.rawMetadata.name,
                    description: rawNft.rawMetadata.description,
                    image: rawNft.rawMetadata.image,
                    tierId: 0,
                    collection: {
                        name: rawNft.contract.name,
                        kind: CollectionKind.edition,
                        address: rawNft.contract.address,
                    },
                },
            };
            accu.push(nft);
            return accu;
        }, []);
    }

    async getNftsIdsByPlugins(plugins: string[]): Promise<string[]> {
        const merkleDatas = await this.merkleTreeRepository
            .createQueryBuilder('merkleTree')
            .select('merkleTree.data', 'data')
            .innerJoin('CollectionPlugin', 'collectionPlugin', 'collectionPlugin.merkleRoot = merkleTree.merkleRoot')
            .where('collectionPlugin.name IN (:...plugins)', { plugins })
            .getRawMany();
        return intersection(
            ...merkleDatas.map((merkleData) => merkleData.data.map((item) => item.tokenId).filter((id) => !isNil(id))));
    }

    async getNftsIdsByProperties(collectionId: string, propertyFilters: PropertyFilter[]): Promise<string[]> {
        const builder = this.nftRepository
            .createQueryBuilder('nft')
            .select('nft.tokenId', 'token_id')
            .where('nft.collectionId = :collectionId', { collectionId })
            .orderBy('token_id', 'ASC');
        const filterConditions = propertyFilters.map((propertyFilter) => {
            const { name, value, range } = propertyFilter;
            if (value) {
                return `properties->'${name}'->>'value'='${value}'`;
            }
            if (range) {
                const [min, max] = range;
                return `(properties->'${name}'->>'value')::INTEGER>=${min} AND (properties->'${name}'->>'value')::INTEGER<=${max}`;
            }
            return '';
        });
        filterConditions.filter((condition) => condition !== '').map((condition) => builder.andWhere(condition));

        return (await builder.getRawMany()).map((nft) => nft.token_id).sort((a, b) => parseInt(a) - parseInt(b));
    }

    /**
     * generate properties from tier.metadata.properties for NFT records
     * basically it will handle 2 things
     * 1. if the property is upgradable, then add `updated_at` field
     * 2. initialize the property value from template string to 0
     *
     * @param candidateProperties
     * @returns
     */
    initializePropertiesFromTier(candidateProperties: MetadataProperties): MetadataProperties {
        const properties: MetadataProperties = {};
        for (const [key, value] of Object.entries(candidateProperties)) {
            const property = Object.assign({}, value);
            if (value.class === 'upgradable') property.updated_at = new Date().valueOf();
            if (value.value?.toString().startsWith('{{') && value.value?.toString().endsWith(
                '}}')) property.value = '0';
            properties[key] = property;
        }
        return properties;
    }

    /**
     * generate properties from tier.metadata.properties for NFT records
     *
     * basically it will handle 3 things
     * 1. if the property is upgradable, then add `updated_at` field
     * 2. initialize the property value from template string to 0
     * 3. filter the properties based on `config.token_scope`
     *
     * @param candidateProperties
     * @returns
     */
    async initializePropertiesFromTierByTokenId(
        tierId: string,
        tokenId: string,
        customizedProperties: MetadataProperties = {},
    ): Promise<MetadataProperties> {
        const tier = await this.tierService.getTier({ id: tierId });
        const tokenScopes = tier.metadata?.configs?.token_scope || [];
        const properties: MetadataProperties = Object.assign(tier.metadata?.properties || {}, customizedProperties);
        for (const [key, value] of Object.entries(properties)) {
            // limit the property attachment according to the `tokenId` and `config.token_scope`
            if (!isEmpty(value.belongs_to)) {
                const scopedTokens = tokenScopes.find((scope) => scope.name === value.belongs_to)?.tokens;
                // if `tokens` array is empty or can find the `tokenId` in the array,
                // then can confirm the property should be attached.
                const permitted = isEmpty(scopedTokens) || (!isEmpty(scopedTokens) && scopedTokens.indexOf(
                    tokenId) >= 0);
                if (!permitted) {
                    delete properties[key];
                    continue;
                }
            }
            const property = Object.assign({}, value);
            if (value.class === 'upgradable') property.updated_at = new Date().valueOf();
            if (value.value?.toString().startsWith('{{') && value.value?.toString().endsWith(
                '}}')) property.value = '0';
            properties[key] = property;
        }
        return properties;
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
    async createOrUpdateNftByTokenId(payload: ICreateOrUpdateNft) {
        const { tokenId, collectionId, tierId, ownerAddress, image } = payload;
        const properties = (await this.initializePropertiesFromTierByTokenId(
            tierId, tokenId, payload.properties)) as any;
        if (image) {
            properties.image = image;
        }
        await this.nftRepository.upsert(
            {
                tokenId,
                collection: { id: collectionId },
                tier: { id: tierId },
                image,
                ownerAddress,
                properties,
            },
            ['collection.id', 'tier.id', 'tokenId'],
        );
        return this.nftRepository.findOneBy({ collection: { id: collectionId }, tier: { id: tierId }, tokenId });
    }

    async updateNftProperties(input: UpdateNftPropertiesInput) {
        const { collectionId, tokenId } = input;
        const nft = await this.getNft({ collection: { id: collectionId }, tokenId });
        if (!nft) return null;
        const uses = nft.tier.metadata.uses || [];
        if (uses.includes('@vibelabs/editable-attributes')) {
            await this.maasService.updateNftProperties(input);
            return this.getNft({ collection: { id: collectionId }, tokenId });
        }
        return nft;
    }
}
