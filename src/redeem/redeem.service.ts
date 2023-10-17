import { GraphQLError } from 'graphql';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';

import { Collection } from '../collection/collection.entity';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { CreateRedeemInput } from './redeem.dto';
import { Redeem } from './redeem.entity';

export type IRedeemQuery = {
    collection: { id: string };
    tokenId: string;
};

export type IRedeemListQuery = {
    collection: { id: string };
    address: string;
    isRedeemed?: boolean;
};

@Injectable()
export class RedeemService {
    constructor(
        @InjectRepository(Redeem) private redeemRepository: Repository<Redeem>,
        private readonly collectionPluginService: CollectionPluginService,
    ) {}

    /**
     * Get a redeem by id
     *
     * @param id
     * @returns
     */
    async getRedeem(id: string): Promise<Redeem> {
        return await this.redeemRepository.findOneBy({ id });
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
        const collectionPlugins = (await Promise.all(collectionPluginIds.map((id) => this.collectionPluginService.getCollectionPlugin(id)))).reduce(
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
        return this.redeemRepository.find({ where: query, relations: ['collectionPlugin'] });
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
