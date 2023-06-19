import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as Sentry from '@sentry/node';
import { GraphQLError } from 'graphql';

import { Redeem } from './redeem.entity';
import { CreateRedeemInput } from './redeem.dto';
import { Collection } from 'src/collection/collection.entity';

@Injectable()
export class RedeemService {

    constructor(@InjectRepository(Redeem) private redeemRepository: Repository<Redeem>) {}

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