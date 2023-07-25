import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GraphQLError } from 'graphql';
import BigNumber from 'bignumber.js';
import { CreateCollaborationInput, CollaborationWithEarnings } from './collaboration.dto';
import { Collaboration } from './collaboration.entity';
import { Wallet } from '../wallet/wallet.entity';
import { User } from '../user/user.entity';
import { Organization } from '../organization/organization.entity';
import { CollectionService } from '../collection/collection.service';
import { CoinService } from '../sync-chain/coin/coin.service';

@Injectable()
export class CollaborationService {
    constructor(
        @InjectRepository(Collaboration)
        private readonly collaborationRepository: Repository<Collaboration>,
        private readonly collectionService: CollectionService,
        private readonly coinService: CoinService
    ) {}

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

    private async calculateEarningsUsd(earningObject: { sum: string; paymentToken: string }): Promise<bigint> {
        if (!earningObject) {
            return BigInt(0);
        }

        const { sum, paymentToken } = earningObject;

        const token = await this.coinService.getCoinByAddress(paymentToken);
        if (!token) {
            throw new Error(`Failed to get token ${paymentToken}`);
        }

        const priceUsd = await this.coinService.getQuote(token.symbol);
        if (!priceUsd || !priceUsd['USD']) {
            throw new Error(`Failed to get price for token ${token.symbol}`);
        }

        const tokenDecimals = token?.decimals || 18;
        const base = BigInt(10);
        const earningsToken = BigInt(sum) / base ** BigInt(tokenDecimals);
        // using BigNumber to convert both numbers to a common format that can handle the precision and range 
        // and convert back to BigInt as a final result
        const earningsUsd = new BigNumber(earningsToken.toString()).multipliedBy(priceUsd['USD'].price).toString();
        const resultAsBigInt = BigInt(Math.floor(new BigNumber(earningsUsd).toNumber()));
        return resultAsBigInt;
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

        const earningsByCollection = await Promise.all(
            collaboration.collections.map(({ address }) =>
                this.collectionService.getCollectionEarningsByCollectionAddress(address)
            )
        );

        const collectionEarningsInUsd: bigint[] = await Promise.all(
            earningsByCollection.map(this.calculateEarningsUsd.bind(this))
        );

        const totalEarnings = Number(
            collectionEarningsInUsd.reduce((total: bigint, earnings: bigint) => total + earnings, BigInt(0))
        );

        const collaborators =
            collaboration.collaborators?.map((collaborator) => {
                const earnings = Math.round(
                    totalEarnings * (collaborator.rate / 100) * (collaboration.royaltyRate / 100)
                );
                return {
                    ...collaborator,
                    earnings,
                };
            }) || [];

        const collaborationWithEarnings: CollaborationWithEarnings = {
            ...collaboration,
            collaborators,
            totalEarnings,
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
