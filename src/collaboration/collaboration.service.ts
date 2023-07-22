import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GraphQLError } from 'graphql';
import { ethers } from 'ethers';
import { CreateCollaborationInput, CollaborationWithEarnings } from './collaboration.dto';
import { Collaboration } from './collaboration.entity';
import { Wallet } from '../wallet/wallet.entity';
import { User } from '../user/user.entity';
import { Organization } from '../organization/organization.entity';
import { CollectionService } from '../collection/collection.service';

@Injectable()
export class CollaborationService {
    constructor(
        @InjectRepository(Collaboration)
        private readonly collaborationRepository: Repository<Collaboration>,
        private readonly collectionService: CollectionService,
    ) { }

    /**
     * Retrieves the collaboration associated with the given id.
     *
     * @param id The id of the collaboration to retrieve.
     * @returns The collaboration associated with the given id.
     */
    async getCollaboration(id: string): Promise<Collaboration> {
        return await this.collaborationRepository.findOne({
            where: { id },
            relations: ['wallet', 'user', 'organization'],
        });
    }

    /**
     * Retrieves the collaboration associated with the given id and calculates the earnings for each collaborator.
     * 
     * @param id The id of the collaboration to retrieve.
     * @returns The collaboration associated with the given id including total earnings and earnings for each collaborator .
     */
    async getCollaborationWithEarnings(id: string): Promise<CollaborationWithEarnings> {
        const collaboration = await this.collaborationRepository.findOne({
            where: { id },
            relations: ['wallet', 'user', 'organization', 'collections'],
        });

        if (!collaboration) {
            throw new GraphQLError(`Collaboration with id ${id} doesn't exist.`, {
                extensions: { code: 'NOT_FOUND' },
            });
        }

        // Get the earnings for each collection
        // getCollectionEarningsByTokenAddress returns earnings in wei 
        const earningsByCollection = await Promise.all(
            collaboration.collections.map(
                ({ address }) => this.collectionService.getCollectionEarningsByCollectionAddress(address)
                    .catch(err => {
                        throw new Error(`Failed to get collection earnings for address ${address}: ${err.message}`);
                    })
            )
        );

        const totalEarningsWei = earningsByCollection.reduce((total, earnings) => total + earnings, BigInt(0));
        // earnings in ETH are rounded to the nearest integer
        // if precision is needed it's probably better to store earnings in wei and do conversion on the UI
        const totalEarningsEth = Math.round(parseInt(ethers.formatEther(totalEarningsWei), 10));

        const collaborators = collaboration.collaborators?.map(collaborator => ({
            ...collaborator,
            earnings: Math.round(totalEarningsEth * (collaborator.rate / 100) * (collaboration.royaltyRate / 100)),
        })) || [];

        // Create a new CollaborationWithEarnings object
        const collaborationWithEarnings: CollaborationWithEarnings = {
            ...collaboration,
            collaborators,
            totalEarnings: totalEarningsEth,
        };

        return collaborationWithEarnings;
    }

    /**
     * Retrieves all collaborations related for a given organization.
     *
     * @param organizationId The id of the user to retrieve collaborations for.
     * @returns The collaborations associated with the given organization.
     */
    async getCollaborationsByOrganizationId(organizationId: string): Promise<Collaboration[]> {
        return await this.collaborationRepository.find({
            where: { organization: { id: organizationId } },
            relations: ['wallet', 'user', 'organization'],
        });
    }

    /**
     * Retrieves all collaborations related for a given user and organization.
     *
     * @param userId The id of the user to retrieve collaborations for.
     * @param organizationId The id of the organization to retrieve collaborations for.
     * @returns The collaborations associated with the given user and organization.
     */
    async getCollaborationsByUserIdAndOrganizationId(userId: string, organizationId: string): Promise<Collaboration[]> {
        return await this.collaborationRepository.find({
            where: { user: { id: userId }, organization: { id: organizationId } },
            relations: ['wallet', 'user', 'organization'],
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
        if (data.walletId) dd.wallet = { id: data.walletId } as unknown as Wallet;
        if (data.userId) dd.user = { id: data.userId } as unknown as User;
        if (data.organizationId) dd.organization = { id: data.organizationId } as unknown as Organization;

        const result = await this.collaborationRepository.save(dd);
        return await this.getCollaboration(result.id);
    }

    // Example: query a nested field
    // async getCollaborations(id: string) {
    // const result = await this.collaborationRepository
    //     .createQueryBuilder('collaboration')
    //     .where('collaboration.collaborators->>"role" = :role', { role: 'test' })
    //     .getMany();
    // }
}
