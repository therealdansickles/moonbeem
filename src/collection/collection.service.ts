import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult, IsNull } from 'typeorm';
import { Collection } from './collection.entity';

@Injectable()
export class CollectionService {
    constructor(
        @InjectRepository(Collection)
        private readonly collectionRepository: Repository<Collection>
    ) {}

    /**
     * Retrieves the collection associated with the given id.
     *
     * @param id The id of the collection to retrieve.
     * @returns The collection associated with the given id.
     */
    async getCollection(id: string): Promise<Collection | null> {
        return this.collectionRepository.findOne({ where: { id }, relations: ['organization'] });
    }

    /**
     * Retrieves the collection associated with the given organization.
     *
     * @param organizationId The id of the organization to retrieve.
     * @returns The collection associated with the given organization.
     */
    async getCollectionsByOrganizationId(organizationId: string): Promise<Collection[]> {
        return this.collectionRepository.find({ where: { organization: { id: organizationId } } });
    }

    /**
     * Retrieves the collection associated with the given name.
     *
     * @param name The name of the collection to retrieve.
     * @returns The collection associated with the given name.
     */
    //async getCollectionByName(name: string): Promise<Collection | null> {
    //return this.prisma.collection.findUnique({
    //where: { name },
    //});
    //}

    /**
     * Creates a new collection with the given data.
     *
     * @param data The data to use when creating the collection.
     * @returns The newly created collection.
     */
    async createCollection(data: any): Promise<Collection> {
        return this.collectionRepository.save(data);
    }

    /**
     * Updates a collection.
     *
     * @param params The id of the collection to update and the data to update it with.
     * @returns A boolean if it updated succesfully.
     */
    async updateCollection(id: string, data: any): Promise<boolean> {
        const result: UpdateResult = await this.collectionRepository.update(id, data);
        return result.affected > 0;
    }

    /**
     * Publishes a collection.
     *
     * @param id The id of the collection to publish.
     * @returns A boolean if it published successfully.
     */
    async publishCollection(id: string): Promise<boolean> {
        const result: UpdateResult = await this.collectionRepository.update(id, { publishedAt: new Date() });
        return result.affected > 0;
    }

    /**
     * Transfers the ownership of a collection to the given user id.
     *
     * @param id The id of the collection to transfer.
     * @param ownerId The id of the user to transfer the collection to.
     * @returns The collection that was transferred.
     */
    //async transferCollection(id: string, ownerId: string): Promise<Collection> {
    //return this.prisma.collection.update({
    //data: { ownerId },
    //where: { id },
    //});
    //}

    /**
     * TODO: Fix this and make it a soft deletion.
     *
     * Deletes a collection if it is not published.
     *
     * @param id The id of the collection to delete.
     * @returns true if the collection was deleted, false otherwise.
     */
    async deleteCollection(id: string): Promise<boolean> {
        const result = await this.collectionRepository.delete({ id, publishedAt: IsNull() });
        return result.affected > 0;
    }
}
