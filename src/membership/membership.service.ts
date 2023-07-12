import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { GraphQLError } from 'graphql';
import { CreateMembershipInput, MembershipRequestInput, UpdateMembershipInput } from './membership.dto';
import { Membership } from './membership.entity';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class MembershipService {
    constructor(
        @InjectRepository(Membership) private membershipRepository: Repository<Membership>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Organization) private organizationRepository: Repository<Organization>,
        private mailService: MailService
    ) {}

    /**
     * Retrieve a membership by id.
     *
     * @param id The id of the membership to retrieve.
     * @returns The membership.
     */
    async getMembership(id: string): Promise<Membership> {
        return await this.membershipRepository.findOneBy({ id });
        //where: { id },
        //relations: { user: true, organization: true },
        //});
    }

    /**
     * Retrieve a membership by organization id.
     *
     * @param organizationId The id of the organization to retrieve memberships for.
     * @returns The memberships.
     */
    async getMembershipsByOrganizationId(organizationId: string): Promise<Membership[]> {
        return await this.membershipRepository.find({
            where: { organization: { id: organizationId } },
        });
    }

    /**
     * Retrieve a membership by user id.
     *
     * @param userId The id of the user to retrieve memberships for.
     * @returns The memberships.
     */
    async getMembershipsByUserId(userId: string): Promise<Membership[]> {
        return await this.membershipRepository.find({
            where: { user: { id: userId } },
        });
    }

    /**
     * Create a new membership.
     *
     * @param data The data to create the membership with.
     * @returns The created membership.
     */
    async createMembership(data: CreateMembershipInput): Promise<Membership> {
        const { userId, organizationId, ...rest } = data;
        const membership = await this.membershipRepository.create(rest);
        membership.organization = await this.organizationRepository.findOneBy({ id: organizationId });
        membership.user = await this.userRepository.findOneBy({ id: userId });
        await this.membershipRepository.insert(membership);
        return await this.membershipRepository.findOneBy({ id: membership.id });
    }

    /**
     * Update a membership.
     *
     * @param id The id of the membership to update.
     * @returns The updated membership.
     */
    async updateMembership(id: string, data: Omit<UpdateMembershipInput, 'id'>): Promise<Membership> {
        const membership = await this.membershipRepository.findOneBy({ id });
        if (!membership) {
            throw new GraphQLError(`Membership with id ${id} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

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

    /**
     * Accepts a membership request
     *
     * @param input MembershipRequestInput object containiner userId and organizationId
     * @returns true if the membership was updated in the database, false otherwise.
     */
    async acceptMembership(input: MembershipRequestInput): Promise<boolean> {
        const membership = await this.membershipRepository.findOne({
            where: {
                user: { id: input.userId },
                organization: { id: input.organizationId },
                acceptedAt: IsNull(),
                declinedAt: IsNull(),
                inviteCode: input.inviteCode,
            },
        });
        if (!membership) {
            throw new GraphQLError(
                `Accept membership request for user ${input.userId} to organization ${input.organizationId} doesn't exist.`,
                {
                    extensions: { code: 'BAD_REQUEST' },
                }
            );
        }

        membership.acceptedAt = new Date();
        membership.inviteCode = null;

        return !!(await this.membershipRepository.save(membership));
    }

    /**
     * Declines a membership request
     *
     * @param input MembershipRequestInput object containiner userId and organizationId
     * @returns true if the membership was updated in the database, false otherwise.
     */
    async declineMembership(input: MembershipRequestInput): Promise<boolean> {
        const membership = await this.membershipRepository.findOne({
            where: {
                user: { id: input.userId },
                organization: { id: input.organizationId },
                declinedAt: IsNull(),
                acceptedAt: IsNull(),
                inviteCode: input.inviteCode,
            },
        });

        if (!membership) {
            throw new GraphQLError(
                `Decline membership request for user ${input.userId} to organization ${input.organizationId} doesn't exist.`,
                {
                    extensions: { code: 'BAD_REQUEST' },
                }
            );
        }

        membership.declinedAt = new Date();
        membership.inviteCode = null;

        return !!(await this.membershipRepository.save(membership));
    }
}
