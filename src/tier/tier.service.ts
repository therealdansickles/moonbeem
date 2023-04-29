import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, UpdateResult } from 'typeorm';

import { Collection } from '../collection/collection.entity';
import { Tier } from './tier.entity';
import { CreateTierInput, UpdateTierInput } from './tier.dto';
import { GraphQLError } from 'graphql';

@Injectable()
export class TierService {
    constructor(
        @InjectRepository(Tier)
        private readonly tierRepository: Repository<Tier>
    ) {}

    /**
     * Get a specific tier by id.
     *
     * @param id The id of the tier.
     * @returns The tier.
     */
    async getTier(id: string): Promise<Tier> {
        return await this.tierRepository.findOneBy({ id });
    }

    /**
     * Get the tiers belonging to a specific collection
     *
     * @param collectionId The id of the collection
     * @returns Array of tiers
     */
    async getTiersByCollection(collectionId: string): Promise<Tier[]> {
        const tiers = await this.tierRepository.find({
            where: { collection: { id: collectionId } },
            relations: { collection: true },
        });
        return tiers;
    }

    /**
     * Create a new tier.
     *
     * @param data The data for the new tier.
     * @returns The new tier.
     */
    async createTier(data: CreateTierInput): Promise<Tier> {
        const dd = data as unknown as Tier;
        dd.collection = data.collection as unknown as Collection;
        try {
            return await this.tierRepository.save(dd);
        } catch (e) {
            throw new GraphQLError(`Failed to create tier ${data.name}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Update a tier.
     *
     * @param id The id of the tier.
     * @param data The data to update.
     * @returns True if the tier was updated.
     */
    async updateTier(id: string, data: Omit<UpdateTierInput, 'id'>): Promise<boolean> {
        try {
            const result: UpdateResult = await this.tierRepository.update(id, data);
            return result.affected > 0;
        } catch (e) {
            throw new GraphQLError(`Failed to update tier ${id}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Delete a tier.
     *
     * @param id The id of the tier.
     * @returns True if the tier was deleted.
     */
    async deleteTier(id: string): Promise<boolean> {
        try {
            const result: DeleteResult = await this.tierRepository.delete({ id });
            return result.affected > 0;
        } catch (e) {
            throw new GraphQLError(`Failed to delete tier ${id}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }
}
