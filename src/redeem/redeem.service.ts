import { GraphQLError } from 'graphql';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';

import { Collection } from '../collection/collection.entity';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.entity';
import { Nft } from '../nft/nft.entity';
import { PHYSICAL_REDEMPTION_PLUGIN_NAME } from './redeem.constants';
import { CreateRedeemInput } from './redeem.dto';
import { Redeem } from './redeem.entity';

export interface IRedeemQueryById {
    id: string;
}
export interface IRedeemQueryByCollection {
    collection: { id: string };
    tokenId: string;
    collectionPlugin?: { id: string };
}

export type IRedeemQuery = IRedeemQueryById | IRedeemQueryByCollection;

export type IRedeemListQuery = {
    collection: { id: string };
    address?: string;
    isRedeemed?: boolean;
};

@Injectable()
export class RedeemService {
    constructor(
        @InjectRepository(Redeem) private redeemRepository: Repository<Redeem>,
        @InjectRepository(CollectionPlugin) private collectionPluginRepositoty: Repository<CollectionPlugin>,
        @InjectRepository(Nft) private NftRepository: Repository<Nft>,
    ) {}

    /**
     * Get a redeem by id
     *
     * @param id
     * @returns
     */
    async getRedeem(query: IRedeemQuery): Promise<Redeem> {
        return await this.redeemRepository.findOneBy(query);
    }

    /**
     * Get overview of redeem group by collection plugin
     *
     * @param collectionId
     * @returns
     */
    async getRedeemOverview(collectionId: string) {
        const aggregatedRedeems =
            (await this.redeemRepository
                .createQueryBuilder('redeem')
                .select('min(cast(redeem.collectionPluginId as varchar)) as collectionPluginId')
                .addSelect('array_agg(redeem.tokenId order by redeem.tokenId)', 'tokenIds')
                .andWhere({ collection: { id: collectionId } })
                .groupBy('redeem.collectionPluginId')
                .getRawMany()) || [];
        const collectionPluginIds = aggregatedRedeems.map((redeem) => redeem.collectionpluginid);
        const collectionPlugins = (await Promise.all(collectionPluginIds.map((id) => this.collectionPluginRepositoty.findOneBy({ id })))).reduce(
            (accu, cp) => {
                accu[cp.id] = (cp.pluginDetail?.recipients || []).length;
                return accu;
            },
            {},
        );
        return aggregatedRedeems.map((redeem) => {
            redeem.recipientsTotal = collectionPlugins[redeem.collectionpluginid];
            redeem.collectionPluginId = redeem.collectionpluginid;
            delete redeem['collectionpluginid'];
            return redeem;
        });
    }

    /**
     * Get redeem list
     *
     * @param query
     * @returns
     */
    async getRedeems(query: IRedeemListQuery): Promise<Redeem[]> {
        return this.redeemRepository.find({ where: query, relations: ['collectionPlugin', 'collection'] });
    }

    /**
     * Get the available redeem qualifications
     *
     * @param collectionId
     * @param address
     */
    async getUnredeemsByAddress(collectionId: string, address: string) {
        const redeems = (await this.getRedeems({ collection: { id: collectionId }, address })) || [];
        const collectionPlugins =
            (await this.collectionPluginRepositoty.find({ where: { collection: { id: collectionId } }, relations: ['plugin'] })) || [];
        const redeemCollectionPlugins = collectionPlugins.filter((plugin) => plugin.plugin?.name === PHYSICAL_REDEMPTION_PLUGIN_NAME);
        if (!redeemCollectionPlugins) return [];

        const nftByOwnerAddress = (await this.NftRepository.findBy({ collection: { id: collectionId }, ownerAddress: address })) || [];
        const result = [];
        for (const nft of nftByOwnerAddress) {
            for (const collectionPlugin of redeemCollectionPlugins) {
                const isAllowedRecipient = (collectionPlugin.pluginDetail?.recipients || []).find((recipient) => recipient === nft.tokenId);
                const isExisted = redeems.find(
                    (redeem) =>
                        redeem.collection.id === nft.collection.id &&
                        redeem.collectionPlugin.id === collectionPlugin.id &&
                        redeem.tokenId === nft.tokenId,
                );
                if (isAllowedRecipient && !isExisted)
                    result.push({
                        tokenId: nft.tokenId,
                        collectionPlugin: collectionPlugin,
                        collection: nft.collection,
                    });
            }
        }
        return result;
    }

    /**
     * Get a redeem by query
     *
     * @param query
     */
    async getRedeemByQuery(query: IRedeemQuery) {
        return await this.redeemRepository.findOneBy(query);
    }

    /**
     * Create a new redeem
     *
     * @param data
     * @returns
     */
    async createRedeem(data: CreateRedeemInput): Promise<Redeem> {
        const existedRedeem = await this.redeemRepository.findOneBy({
            collection: { id: data.collection.id },
            collectionPlugin: { id: data.collectionPluginId },
            tokenId: data.tokenId,
        });
        if (existedRedeem)
            throw new GraphQLError('This token has already been redeemed.', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        try {
            const payload = {
                deliveryAddress: data.deliveryAddress,
                deliveryCity: data.deliveryCity,
                deliveryZipcode: data.deliveryZipcode,
                deliveryState: data.deliveryState,
                deliveryCountry: data.deliveryCountry,
                deliveryPhone: data.deliveryPhone,
                email: data.email,
                tokenId: data.tokenId,
                collection: data.collection.id as unknown as Collection,
                collectionPlugin: { id: data.collectionPluginId },
                address: data.address,
                name: data.name,
                isRedeemed: true,
            };
            return this.redeemRepository.save(payload);
        } catch (e) {
            Sentry.captureException(e);
            throw new GraphQLError('Failed to create new redeem.', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }
}
