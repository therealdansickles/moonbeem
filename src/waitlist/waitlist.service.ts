import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Waitlist } from './waitlist.entity';
import { Repository, UpdateResult } from 'typeorm';
import { CreateWaitlistInput } from './waitlist.dto';
import { ethers } from 'ethers';

@Injectable()
export class WaitlistService {
    constructor(@InjectRepository(Waitlist) private waitlistRepository: Repository<Waitlist>) {}

    /**
     * Retrieves a waitlist item associated with the given email.
     *
     * @param email The email of the user to retrieve.
     * @returns The waitlist item associated with the given email.
     */
    async getWaitlist(email: string): Promise<Waitlist | null> {
        return this.waitlistRepository.findOneBy({ email });
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
            throw new HttpException('signature verification failure', HttpStatus.BAD_REQUEST);
        }
        return await this.waitlistRepository.save(input);
    }
}
