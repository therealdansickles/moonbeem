import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Waitlist } from './waitlist.entity';
import { Repository } from 'typeorm';
import { CreateWaitlistInput, GetWaitlistInput, ClaimWaitlistInput } from './waitlist.dto';
import { ethers } from 'ethers';
import { GraphQLError } from 'graphql';
import { captureException } from '@sentry/node';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';

@Injectable()
export class WaitlistService {
    constructor(
        @InjectRepository(Waitlist) private waitlistRepository: Repository<Waitlist>,
        @InjectRepository(MintSaleTransaction, 'sync_chain') private transaction: Repository<MintSaleTransaction>
    ) {}

    /**
     * Retrieves a waitlist item associated with the given email.
     *
     * @param email The email of the user to retrieve.
     * @returns The waitlist item associated with the given email.
     */
    async getWaitlist(input: GetWaitlistInput): Promise<Waitlist | null> {
        if (!input.email && !input.address) {
            return null;
        }
        return this.waitlistRepository.findOne({ where: input });
    }

    /**
     * Create a new waitlist item.
     *
     * @param data The data to create the waitlist item with.
     * @returns The created waitlist item.
     */
    async createWaitlist(input: CreateWaitlistInput): Promise<Waitlist> {
        const verifiedAddress = ethers.verifyMessage(input.message, input.signature);
        if (input.address.toLowerCase() !== verifiedAddress.toLocaleLowerCase()) {
            throw new GraphQLError('signature verification failure', {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        try {
            return await this.waitlistRepository.save(input);
        } catch (e) {
            if (e.routine === '_bt_check_unique') {
                throw new GraphQLError('Email or wallet address already exists', {
                    extensions: { code: 'BAD_REQUEST' },
                });
            } else {
                captureException(e);
                throw new GraphQLError('Failed to create waitlist item', {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }
    }

    /**
     * Claim a Waitlist.
     *
     * @param input The address, signature, and message to claim the waitlist.
     * @returns A boolean whether or not if the waitlist was claimed.
     */
    async claimWaitlist(input: ClaimWaitlistInput): Promise<boolean> {
        try {
            const verifiedAddress = ethers.verifyMessage(input.message, input.signature);

            if (input.address.toLowerCase() !== verifiedAddress.toLocaleLowerCase()) {
                throw new GraphQLError('signature verification failure', {
                    extensions: { code: 'BAD_REQUEST' },
                });
            }

            const result = await this.waitlistRepository.update({ address: input.address }, { isClaimed: true });
            return result.affected > 0;
        } catch (error) {
            throw new GraphQLError('signature verification failure', {
                extensions: { code: 'BAD_REQUEST' },
            });
        }
    }
}
