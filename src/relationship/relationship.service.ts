import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GraphQLError } from "graphql";
import { WalletService } from "../wallet/wallet.service";
import { CreateRelationshipByAddressInput, CreateRelationshipInput } from './relationship.dto';
import { Relationship } from './relationship.entity';

@Injectable()
export class RelationshipService {
    constructor(
        @InjectRepository(Relationship) private relationshipRepository: Repository<Relationship>,
        private walletService: WalletService
    ) { }

    /**
     * Get the follower list for given address.
     * 
     * @param address
     * @returns
     */
    async getFollowersByAddress(address: string): Relationship {
        const wallet = await this.walletService.checkWalletExistence(address);
        return this.getFollowers(wallet.id);
    }

    /**
     * Get the follower list for given wallet id.
     * 
     * @param followingWalletId
     * @returns
     */
    async getFollowers(followingWalletId: string) {
        return this.relationshipRepository.find({
            where: { following: { id: followingWalletId } },
            relations: ['following', 'follower']
        });
    }

    /**
     * Get the follower list for given address.
     * 
     * @param address
     * @returns
     */
    async getFollowingsByAddress(address: string) {
        const wallet = await this.walletService.checkWalletExistence(address);
        return this.getFollowings(wallet.id);
    }

    /**
     * Get the following list for given wallet id.
     * 
     * @param followerWalletId
     * @returns
     */
    async getFollowings(followerWalletId: string) {
        return this.relationshipRepository.find({
            where: { follower: { id: followerWalletId } },
            relations: ['following', 'follower']
        });
    }

    /**
     * Get the follower count for given address.
     * 
     * @param address
     * @returns
     */
    async countFollowersByAddress(address: string) {
        const wallet = await this.walletService.checkWalletExistence(address);
        return this.countFollowers(wallet.id)
    }

    /**
     * Get the follower count for given wallet id.
     * 
     * @param followerWalletId
     * @returns
     */
    async countFollowers(followerWalletId: string) {
        return this.relationshipRepository.countBy({ following: { id: followerWalletId } });
    }

    /**
     * Get the following count for given address
     * 
     * @param address
     */
    async countFollowingsByAddress(address: string) {
        const wallet = await this.walletService.checkWalletExistence(address);
        return this.countFollowings(wallet.id);
    }

    /**
     * Get the following count for given wallet id
     * 
     * @param address
     * @returns
     */
    async countFollowings(followerWalletId: string) {
        return this.relationshipRepository.countBy({ follower: { id: followerWalletId } });
    }

    /**
     * Create relationship between two addresses
     * 
     * @param input
     * @returns
     */
    async createRelationshipByAddress(input: CreateRelationshipByAddressInput) {
        const followerWallet = await this.walletService.checkWalletExistence(input.followerAddress);
        const followingWallet = await this.walletService.checkWalletExistence(input.followingAddress);
        return this.createRelationship({
            follower: { id: followerWallet.id },
            following: { id: followingWallet.id }
        });
    }

    /**
     * Create relationship between two wallet id
     * 
     * @param input
     * @returns
     */
    private async createRelationship(input: CreateRelationshipInput): Promise<Relationship> {
        const relationship = await this.relationshipRepository.save(input)
        return await this.relationshipRepository.findOne({
            where: { id: relationship.id },
            relations: ['following', 'follower']
        });
    }
}