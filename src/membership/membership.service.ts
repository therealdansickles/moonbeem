import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { GraphQLError } from 'graphql';
import { CreateMembershipInput, MembershipRequestInput, UpdateMembershipInput } from './membership.dto';
import { Membership } from './membership.entity';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import * as randomString from 'randomstring';
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
     * Create a new membership.
     *
     * @param data The data to create the membership with.
     * @returns The created membership.
     */
    async createMembership(data: CreateMembershipInput): Promise<Membership> {
        try {
            const user = await this.userRepository.findOneBy({ id: data.userId });
            if (!user) {
                throw new GraphQLError(`user ${data.userId} does not exist`);
            }

            const organization = await this.organizationRepository.findOneBy({ id: data.organizationId });
            if (!organization) {
                throw new GraphQLError(`organization ${data.userId} does not exist`);
            }

            // invite token
            const inviteCode = randomString.generate(7);

            const membership = new Membership();

            membership.organization = organization;
            membership.user = user;
            membership.inviteCode = inviteCode;

            const { userId, organizationId, ...rest } = data;

            Object.assign(membership, rest);

            await this.mailService.sendMemberInviteEmail(user.email, user.name, organization.name, inviteCode);
            return await this.membershipRepository.save(membership);
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
            throw new Error(
                `Membership request for user ${input.userId} to organization ${input.organizationId} doesn't exist.`
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
            throw new Error(
                `Membership request for user ${input.userId} to organization ${input.organizationId} doesn't exist.`
            );
        }

        membership.declinedAt = new Date();
        membership.inviteCode = null;

        return !!(await this.membershipRepository.save(membership));
    }
}
