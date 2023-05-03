import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { CreateOrganizationInput, UpdateOrganizationInput } from './organization.dto';
import { User } from '../user/user.entity';
import { GraphQLError } from 'graphql';
import { MembershipService } from '../membership/membership.service';

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(Organization) private organizationRepository: Repository<Organization>,
        @InjectRepository(User) private userRepository: Repository<User>,
        private membershipService: MembershipService
    ) {}

    /**
     * Retrieve an organization by id.
     *
     * @param id The id of the organization to retrieve.
     * @returns The organization.
     */
    async getOrganization(id: string): Promise<Organization> {
        return await this.organizationRepository.findOneBy({ id });
    }

    /**
     * Create a new organization.
     *
     * @param data The data to create the organization with.
     * @returns The created organization..
     */
    async createOrganization(data: CreateOrganizationInput): Promise<Organization> {
        const orgWithSameName = await this.organizationRepository.findOneBy({ name: data.name });
        if (orgWithSameName) {
            throw new GraphQLError(`Organization with name ${data.name} already existed.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        const owner = await this.userRepository.findOneBy({ id: data.owner.id });

        const { invites, ...createOrganizationData } = data;

        const organization = await this.organizationRepository.save(createOrganizationData);

        if (invites) {
            for (const invite of invites) {
                await this.membershipService.createMembership(
                    {
                        email: invite.toLowerCase(),
                        organizationId: organization.id,
                        canEdit: true,
                    },
                    owner
                );
            }
        }

        return await this.organizationRepository.findOne({
            where: { id: organization.id },
            relations: ['owner'],
        });
    }

    /**
     * Update an organization.
     *
     * @param id The id of the organization to update.
     * @param data The data to update the organization with.
     * @returns The updated organization.
     */
    async updateOrganization(id: string, data: Omit<UpdateOrganizationInput, 'id'>): Promise<Organization> {
        const organization = await this.organizationRepository.findOneBy({ id });
        if (!organization) {
            throw new GraphQLError(`Organization with id ${id} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }
        // if name is need to be updated, then check if it's uniqueness first
        if (data.name) {
            const orgWithSameName = await this.organizationRepository.findOneBy({ name: data.name });
            if (orgWithSameName) {
                throw new GraphQLError(`Organization with name ${data.name} already existed.`, {
                    extensions: { code: 'BAD_REQUEST' },
                });
            }
        }

        try {
            await this.organizationRepository.save({ ...organization, ...data });
            return await this.organizationRepository.findOne({
                where: { id: organization.id },
                relations: ['owner'],
            });
        } catch (e) {
            throw new GraphQLError(`Failed to update organization ${id}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Retrieve organizations by owner id.
     *
     * @param ownerId The id of the user to retrieve owned organizations for.
     * @returns The organizations.
     */
    async getOrganizationsByOwnerId(ownerId: string): Promise<Organization[]> {
        return await this.organizationRepository.find({
            where: { owner: { id: ownerId } },
        });
    }

    /**
     * TODO: Fix this and make it a soft deletion.
     *
     * Deletes a organization if it is not published.
     *
     * @param id The id of the organization to delete.
     * @returns true if the organization was deleted, false otherwise.
     */
    async deleteOrganization(id: string): Promise<boolean> {
        const result = await this.organizationRepository.delete({ id });
        return result.affected > 0;
    }

    /**
     * Transfer an organization to another user.
     *
     * @param id The id of the organization to transfer.
     * @param ownerId The id of the user to transfer the organization to.
     * @returns The updated organization.
     */
    async transferOrganization(id: string, ownerId: string): Promise<Organization> {
        const organization = await this.organizationRepository.findOneBy({ id });
        if (!organization) {
            throw new GraphQLError(`Organization with id ${id} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        const owner = await this.userRepository.findOneBy({ id: ownerId });
        if (!owner) {
            throw new GraphQLError(`User with id ${ownerId} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        organization.owner = owner;

        try {
            return this.organizationRepository.save(organization);
        } catch (e) {
            throw new GraphQLError(`Failed to transfer organization ${id} to user ${ownerId}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }
}
