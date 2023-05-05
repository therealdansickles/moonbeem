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
        const dd = data as unknown as Collaboration;
        // if (data.collectionId) dd.collection = data.collectionId as unknown as Collection;
        if (data.walletId) dd.wallet = data.walletId as unknown as Wallet;
        if (data.userId) dd.user = data.userId as unknown as User;
        if (data.organizationId) dd.organization = data.organizationId as unknown as Organization;
        // return await this.collaborationRepository.save(dd);
        const saveResult = await this.collaborationRepository.save(dd);

        return await this.collaborationRepository.findOne({
            where: { id: saveResult.id },
            relations: ['wallet', 'user', 'collection', 'organization'],
        });
    }

    // Example: query a nested field
    // async getCollaborations(id: string) {
    // const result = await this.collaborationRepository
    //     .createQueryBuilder('collaboration')
    //     .where('collaboration.collaborators->>"role" = :role', { role: 'test' })
    //     .getMany();
    // }
}
