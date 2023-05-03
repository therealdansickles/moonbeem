import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ArrayContains, Repository } from 'typeorm';
import { GraphQLError } from 'graphql';
import { CreateCollaborationInput } from './collaboration.dto';
import { Collaboration } from './collaboration.entity';
import { Collection } from '../collection/collection.entity';
import { Wallet } from '../wallet/wallet.entity';
import { User } from '../user/user.entity';
import { Organization } from '../organization/organization.entity';

@Injectable()
export class CollaborationService {
    constructor(@InjectRepository(Collaboration) private collaborationRepository: Repository<Collaboration>) {}

    /**
     * Retrieves the collaboration associated with the given id.
     *
     * @param id The id of the collaboration to retrieve.
     * @returns The collaboration associated with the given id.
     */
    async getCollaboration(id: string): Promise<Collaboration> {
        return await this.collaborationRepository.findOne({ where: { id }, relations: ['collection', 'wallet'] });
    }

    /**
     * Retrieves all collaborations related for a given user and organization.
     */
    async getCollaborationsByUserIdAndOrganizationId(userId: string, organizationId: string): Promise<Collaboration[]> {
        return await this.collaborationRepository.find({
            where: { user: { id: userId }, organization: { id: organizationId } },
            relations: ['user', 'organization'],
        });
    }

    /**
     * Creates a new collaboration with the given data.
     *
     * @param data The data to use when creating the collaboration.
     * @returns The newly created collaboration
     */
    async createCollaboration(data: CreateCollaborationInput): Promise<Collaboration> {
        // TEMP: only do the check if collectionId and walletId both provided
        if (data.collectionId && data.walletId) {
            // check if wallet-collection pair is unique
            const uniqueCheck = await this.collaborationRepository.findOne({
                where: {
                    collection: { id: data.collectionId },
                    wallet: { id: data.walletId },
                },
            });
            if (uniqueCheck)
                throw new GraphQLError(
                    `wallet ${data.walletId} is already collaborating with collection ${data.collectionId}`,
                    { extensions: { code: 'BAD_REQUEST' } }
                );
        }
        // TEMP: only check if collectionId is provided
        if (data.collectionId) {
            // get existed collaboration within the same collection
            // if sum of royalty from existed + new one > 100 wouldn't pass the validation
            const existedCollaborations = await this.collaborationRepository.find({
                where: { collection: { id: data.collectionId } },
            });
            const sumOfExistedRoyalty = existedCollaborations.reduce((sum, c) => c.royaltyRate + sum, 0);
            if (sumOfExistedRoyalty + data.royaltyRate > 100) {
                throw new GraphQLError(`collection ${data.collectionId} royalty out of bound`, {
                    extensions: { code: 'BAD_REQUEST' },
                });
            }
        }

        const dd = data as unknown as Collaboration;
        if (data.collectionId) dd.collection = data.collectionId as unknown as Collection;
        if (data.walletId) dd.wallet = data.walletId as unknown as Wallet;
        if (data.userId) dd.user = data.userId as unknown as User;
        if (data.organizationId) dd.organization = data.organizationId as unknown as Organization;
        return await this.collaborationRepository.save(dd);
    }

    // Example: query a nested field
    // async getCollaborations(id: string) {
    // const result = await this.collaborationRepository
    //     .createQueryBuilder('collaboration')
    //     .where('collaboration.collaborators->>"role" = :role', { role: 'test' })
    //     .getMany();
    // }
}
