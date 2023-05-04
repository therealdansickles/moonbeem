import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Waitlist } from './waitlist.entity';
import { Repository, UpdateResult } from 'typeorm';
import { CreateWaitlistInput, GetWaitlistInput } from './waitlist.dto';
import { ethers } from 'ethers';
import { GraphQLError } from 'graphql';
import * as Sentry from '@sentry/node';

@Injectable()
export class WaitlistService {
    constructor(@InjectRepository(Waitlist) private waitlistRepository: Repository<Waitlist>) {}

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
        return this.waitlistRepository.findOne({ where: [{ email: input.email }, { address: input.address }] });
    }

    /**
     * Create a new waitlist item.
     *
     * @param data The data to create the waitlist item with.
     * @returns The created waitlist item.
     */
    async createWaitlist(input: CreateWaitlistInput): Promise<Waitlist> {
        const verifiedAddress = ethers.utils.verifyMessage(input.message, input.signature);
        if (input.address.toLowerCase() !== verifiedAddress.toLocaleLowerCase()) {
            throw new GraphQLError(`signature verification failure`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        try {
            return await this.waitlistRepository.save(input);
        } catch (e) {
            if (e.routine === '_bt_check_unique') {
                throw new GraphQLError(`Email or wallet address already exists`, {
                    extensions: { code: 'BAD_REQUEST' },
                });
            } else {
                Sentry.captureException(e);
                throw new GraphQLError(`Failed to create waitlist item`, {
                    extensions: { code: 'INTERNAL_SERVER_ERROR' },
                });
            }
        }
    }
}
