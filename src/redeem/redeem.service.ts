import { GraphQLError } from 'graphql';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';

import { Collection } from '../collection/collection.entity';
import { CreateRedeemInput } from './redeem.dto';
import { Redeem } from './redeem.entity';

export type IRedeemQuery = {
    collection: { id: string };
    tokenId: number;
};

export type IRedeemListQuery = {
    collection: { id: string };
    address: string;
    isRedeemed?: boolean;
};

@Injectable()
export class RedeemService {
    constructor(@InjectRepository(Redeem) private redeemRepository: Repository<Redeem>) {}

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
     * Get redeem list
     *
     * @param query
     * @returns
     */
    async getRedeems(query: IRedeemListQuery): Promise<Redeem[]> {
        return this.redeemRepository.findBy(query);
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
