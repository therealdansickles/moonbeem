import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './organization.entity';
import { CreateOrganizationInput, UpdateOrganizationInput } from './organization.dto';

@Injectable()
export class OrganizationService {
    constructor(@InjectRepository(Organization) private organizationRepository: Repository<Organization>) {}

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
        return await this.organizationRepository.save(data);
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
        if (!organization) throw new Error(`Organization with id ${id} doesn't exist.`);
        return this.organizationRepository.save({ ...organization, ...data });
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
        if (!organization) throw new Error(`Organization with id ${id} doesn't exist.`);
        return this.organizationRepository.save({ ...organization, ownerId });
    }
}
