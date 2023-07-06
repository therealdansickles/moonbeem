import { GraphQLError } from 'graphql';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';

import { Collection } from '../collection/collection.entity';
import { CreateRedeemInput } from './redeem.dto';
import { Redeem } from './redeem.entity';

export type IRedeemQuery = {
    collection: { id: string },
    tokenId: number,
}

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
     * Get a redeem by query
     * 
     * @param query
     */
    async getRedeemByQuery(query: IRedeemQuery) {
        return await this.redeemRepository.findOneBy(query)
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
                email: data.email,
                tokenId: data.tokenId,
                collection: data.collection.id as unknown as Collection
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