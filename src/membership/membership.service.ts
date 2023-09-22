import { GraphQLError } from 'graphql';
import { IsNull, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { MailService } from '../mail/mail.service';
import { Organization } from '../organization/organization.entity';
import { User } from '../user/user.entity';
import { CreateMembershipInput, ICreateMembership, MembershipRequestInput, UpdateMembershipInput } from './membership.dto';
import { Membership } from './membership.entity';
import { Roles } from './membership.constant';

@Injectable()
export class MembershipService {
    constructor(
        private readonly mailService: MailService,
        @InjectRepository(Membership) private membershipRepository: Repository<Membership>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Organization) private organizationRepository: Repository<Organization>
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
     * Retrieve a membership by id with the organization.
     *
     * @param id The id of the membership to retrieve.
     * @returns The membership.
     */
    async getMembershipWithOrganizationAndUser(id: string): Promise<Membership> {
        return await this.membershipRepository.findOne({
            where: { id },
            relations: ['organization', 'user'],
        });
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
            relations: ['organization', 'user'],
        });
    }

    /**
     * Check
     *
     * @param organizationId
     * @param userId
     */
    async checkMembershipByOrganizationIdAndUserId(organizationId: string, userId: string) {
        const count = await this.membershipRepository.countBy({
            organization: { id: organizationId },
            user: { id: userId },
        });
        return count > 0;
    }

    /**
     * Create a new membership.
     *
     * @param email The email of the user to create the membership for.
     * @param data The data to create the membership with.
     * @returns The created membership.
     */
    async createMembership(email: string, data: ICreateMembership): Promise<Membership> {
        const { organization, ...rest } = data;
        const membership = await this.membershipRepository.create(rest);
        // membership.organization = await this.organizationRepository.findOneBy({ id: organizationId });
        membership.organization = organization;
        // We try to attach a user that we find in the database but it's possible
        // that they may invite someone not in the system. therefore we should still set `email`
        // and treat that as the source of truth.
        membership.user = await this.userRepository.findOneBy({ email });
        membership.email = email;
        // The upsert won't trigger the `BeforeInsert` hook so we need to set the invite code here.
        membership.setInviteCode();
        // use `upsert` to ignore the existed membership but not throw an error
        await this.membershipRepository.upsert(membership, ['email', 'organization.id']);

        return await this.membershipRepository.findOneBy({ id: membership.id });
    }

    /**
     * Create multiple memberships.
     * The emails passed in will share the same role and permissions.
     * @param data The data to create the memberships with.
     */
    async createMemberships(data: CreateMembershipInput): Promise<Membership[]> {
        const { emails, organizationId, role, ...rest } = data;

        const organization = await this.organizationRepository.findOneBy({ id: organizationId });
        if (!organization) {
            throw new GraphQLError(`Membership with organization id ${organizationId} doesn't exist`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        return Promise.all(
            emails
                .filter((email) => !!email)
                .map((email) =>
                    this.createMembership(email, { organization, role: role || Roles.Member, ...rest }).then((membership) => {
                        this.mailService.sendInviteEmail(email, membership.inviteCode);
                        return membership;
                    })
                )
        );
    }

    /**
     * Update a membership.
     *
     * @param id The id of the membership to update.
     * @param data The data to update the membership with.
     * @returns The updated membership.
     */
    async updateMembership(id: string, data: Omit<UpdateMembershipInput, 'id'>): Promise<Membership> {
        const membership = await this.membershipRepository.findOneBy({ id });
        if (!membership) {
            throw new GraphQLError(`Membership with id ${id} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        return await this.membershipRepository.save({ ...membership, ...data });
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
     * @param input MembershipRequestInput object container userId and organizationId
     * @returns true if the membership was updated in the database, false otherwise.
     */
    async acceptMembership(input: MembershipRequestInput): Promise<boolean> {
        const membership = await this.membershipRepository.findOne({
            where: {
                email: input.email,
                organization: { id: input.organizationId },
                acceptedAt: IsNull(),
                declinedAt: IsNull(),
                inviteCode: input.inviteCode,
            },
        });
        if (!membership) {
            throw new GraphQLError(`We couldn't find a membership request for ${input.email} to organization ${input.organizationId}.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        membership.acceptedAt = new Date();
        membership.inviteCode = null;
        if (!membership.user) {
            membership.user = await this.userRepository.findOneBy({ email: input.email });
        }

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
                user: { email: input.email },
                organization: { id: input.organizationId },
                declinedAt: IsNull(),
                acceptedAt: IsNull(),
                inviteCode: input.inviteCode,
            },
        });

        if (!membership) {
            throw new GraphQLError(`We couldn't find a membership request for ${input.email} to organization ${input.organizationId}.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        membership.declinedAt = new Date();
        membership.inviteCode = null;

        return !!(await this.membershipRepository.save(membership));
    }
}
