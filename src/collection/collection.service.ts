import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult, IsNull } from 'typeorm';

import * as collectionEntity from './collection.entity';
import { GraphQLError } from 'graphql';
import { Tier } from '../tier/tier.entity';
import { Collection, CreateCollectionInput } from './collection.dto';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Wallet } from '../wallet/wallet.entity';
import { Collaboration } from '../collaboration/collaboration.entity';

@Injectable()
export class CollectionService {
    constructor(
        @InjectRepository(collectionEntity.Collection)
        private readonly collectionRepository: Repository<collectionEntity.Collection>,
        @InjectRepository(Tier)
        private readonly tierRepository: Repository<Tier>,
        @InjectRepository(Wallet)
        private readonly walletRepository: Repository<Wallet>,
        @InjectRepository(Collaboration)
        private readonly collaborationRepository: Repository<Collaboration>,

        @InjectRepository(MintSaleContract, 'sync_chain')
        private readonly mintSaleContractRepository: Repository<MintSaleContract>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private readonly mintSaleTransactionRepository: Repository<MintSaleTransaction>
    ) {}

    /**
     * Retrieves the collection associated with the given id.
     *
     * @param id The id of the collection to retrieve.
     * @returns The collection associated with the given id.
     */
    async getCollection(id: string): Promise<Collection | null> {
        return await this.collectionRepository.findOne({
            where: { id },
            relations: ['organization', 'tiers', 'creator', 'collaboration'],
        });
    }

    /**
     * Retrieves the collection associated with the given address.
     *
     * @param address The address of the collection to retrieve.
     * @returns The collection associated with the given address.
     */
    async getCollectionByAddress(address: string): Promise<Collection | null> {
        const collection = await this.collectionRepository.findOne({
            where: { address },
            relations: ['organization', 'tiers', 'creator', 'collaboration'],
        });
        const contract = await this.mintSaleContractRepository.findOne({ where: { collectionId: collection.id } });

        return {
            ...collection,
            contract,
        };
    }

    /**
     * Retrieves the collection associated with the given organization.
     *
     * @param organizationId The id of the organization to retrieve.
     * @returns The collection associated with the given organization.
     */
    async getCollectionsByOrganizationId(organizationId: string): Promise<Collection[]> {
        const result: Collection[] = [];
        const collections = await this.collectionRepository.find({
            where: { organization: { id: organizationId } },
            relations: ['organization', 'tiers', 'creator', 'collaboration'],
        });

        for (const collection of collections) {
            const contract = await this.mintSaleContractRepository.findOne({ where: { collectionId: collection.id } });
            result.push({
                ...collection,
                contract,
            });
        }

        return result;
    }

    /**
     * Retrieves the collection associated with the given wallet.
     *
     * @param walletId The id of the wallet to retrieve.
     * @returns The collection associated with the given wallet.
     */
    async getCreatedCollectionsByWalletId(walletId: string): Promise<Collection[]> {
        return await this.collectionRepository.find({
            where: { creator: { id: walletId } },
            relations: ['organization', 'tiers', 'creator', 'collaboration'],
        });
    }

    /**
     * Creates a new collection with the given data.
     *
     * @param data The data to use when creating the collection.
     * @returns The newly created collection.
     */
    async createCollection(data: any): Promise<Collection> {
        try {
            return this.collectionRepository.save(data);
        } catch (e) {
            throw new GraphQLError('Failed to create new collection.', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Updates a collection.
     *
     * @param params The id of the collection to update and the data to update it with.
     * @returns A boolean if it updated succesfully.
     */
    async updateCollection(id: string, data: any): Promise<boolean> {
        try {
            const result: UpdateResult = await this.collectionRepository.update(id, data);
            return result.affected > 0;
        } catch (e) {
            throw new GraphQLError(`Failed to update collection ${id}.`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Publishes a collection.
     *
     * @param id The id of the collection to publish.
     * @returns A boolean if it published successfully.
     */
    async publishCollection(id: string): Promise<boolean> {
        try {
            const result: UpdateResult = await this.collectionRepository.update(id, { publishedAt: new Date() });
            return result.affected > 0;
        } catch (e) {
            throw new GraphQLError(`Failed to publish collection ${id}.`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * TODO: Fix this and make it a soft deletion.
     *
     * Deletes a collection if it is not published.
     *
     * @param id The id of the collection to delete.
     * @returns true if the collection was deleted, false otherwise.
     */
    async deleteCollection(id: string): Promise<boolean> {
        try {
            const result = await this.collectionRepository.delete({ id, publishedAt: IsNull() });
            return result.affected > 0;
        } catch (e) {
            throw new GraphQLError(`Failed to delete collection ${id}.`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    // FIXME: We should clean this up and remove/merge createCollection then.
    /**
     * Creates a new collection with the given tiers.
     *
     * @param data The data to use when creating the collection.
     * @returns The newly created collection.
     */
    async createCollectionWithTiers(data: CreateCollectionInput) {
        const { tiers, ...collection } = data;
        const kind = collectionEntity.CollectionKind;
        if ([kind.whitelistEdition, kind.whitelistTiered, kind.whitelistBulk].indexOf(collection.kind) >= 0) {
            tiers.forEach((tier) => {
                if (!tier.merkleRoot)
                    throw new GraphQLError('Please provide merkleRoot for the whitelisting collection.');
            });
        }

        const createResult = await this.collectionRepository.save(collection as Collection);

        if (tiers) {
            for (const tier of tiers) {
                const dd = tier as unknown as Tier;
                dd.collection = createResult.id as unknown as collectionEntity.Collection;
                const attributesJson = JSON.stringify(tier.attributes);
                dd.attributes = attributesJson;

                try {
                    await this.tierRepository.save(dd);
                } catch (e) {
                    throw new GraphQLError(`Failed to create tier ${data.name}`, {
                        extensions: { code: 'INTERNAL_SERVER_ERROR' },
                    });
                }
            }
        }

        const result = await this.collectionRepository.findOne({
            where: { id: createResult.id },
            relations: ['tiers', 'organization', 'collaboration'],
        });
        return result;
    }

    /**
     * Get the buyers/wallet of the collection. A buyer is a wallet who has at least one NFT from the collection.
     *
     * @param address The address of the collection.
     */
    async getBuyers(address: string): Promise<string[]> {
        const result = await this.mintSaleTransactionRepository
            .createQueryBuilder('MintSaleTransaction')
            .select('recipient')
            .distinctOn(['"MintSaleTransaction".recipient'])
            .where('address = :address', { address })
            .getRawMany();

        return result.map((r) => r.recipient);

        // NOTE: use this when we wanna attach wallet. CURENTLY, we will not have wallet's for every address
        // so this WILL BREAK.
        //return await this.walletRepository.find({ where: { address: In(result.map((r) => r.recipient)) } });
    }
}
