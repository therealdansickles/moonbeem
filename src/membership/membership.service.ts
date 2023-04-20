import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GraphQLError } from 'graphql';
import { CreateMembershipInput, UpdateMembershipInput } from './membership.dto';
import { Membership } from './membership.entity';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import { validate } from 'class-validator';

@Injectable()
export class MembershipService {
    constructor(@InjectRepository(Membership) private membershipRepository: Repository<Membership>) {}

    /**
     * Retrieve a membership by id.
     *
     * @param id The id of the membership to retrieve.
     * @returns The membership.
     */
    async getMembership(id: string): Promise<Membership> {
        return await this.membershipRepository.findOneBy({ id });
    }

    /**
     * Create a new membership.
     *
     * @param data The data to create the membership with.
     * @returns The created membership.
     */
    async createMembership(data: CreateMembershipInput): Promise<Membership> {
        try {
            const dd = data as unknown as Membership;
            dd.organization = data.organizationId as unknown as Organization;
            dd.user = data.userId as unknown as User;
            return await this.membershipRepository.save(dd);
        } catch (e) {
            // FIXME: This ain't always true :issou:
            // Add Sentry capture here.
            throw new GraphQLError(`user ${data.userId} is already a member of organization ${data.organizationId}`);
        }
    }

    /**
     * Update a membership.
     *
     * @param id The id of the membership to update.
     * @returns The updated membership.
     */
    async updateMembership(id: string, data: Omit<UpdateMembershipInput, 'id'>): Promise<Membership> {
        const membership = await this.membershipRepository.findOneBy({ id });
        if (!membership) throw new Error(`Membership with id ${id} doesn't exist.`);
        return this.membershipRepository.save({ ...membership, ...data });
    }

    /**
     * Deletes a membership.
     *
     * @param id The id of the membership to delete.
     * @returns true if the membership was deleted, false otherwise.
     */
    async deleteMembership(id: string): Promise<boolean> {
        const result = await this.membershipRepository.delete({ id });
        return result.affected > 0;
    }
}
