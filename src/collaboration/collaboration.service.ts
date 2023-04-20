import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GraphQLError } from 'graphql';
import { CreateCollaborationInput } from './collaboration.dto';
import { Collaboration } from './collaboration.entity';
import { Collection } from '../collection/collection.entity';
import { Wallet } from '../wallet/wallet.entity';

@Injectable()
export class CollaborationService {
    constructor(@InjectRepository(Collaboration) private collaborationRepository: Repository<Collaboration>) {}

    /**
     * Retrieves the collaboration associated with the given id.
     *
     * @param id The id of the collaboration to retrieve.
     * @returns The collaboration associated with the given id.
     */
    async getCollaboration(id: string): Promise<Collaboration> {
        return await this.collaborationRepository.findOneBy({ id });
    }

    /**
     * Creates a new collaboration with the given data.
     *
     * @param data The data to use when creating the collaboration.
     * @returns The newly created collaboration
     */
    async createCollaboration(data: CreateCollaborationInput): Promise<Collaboration> {
        try {
            const dd = data as unknown as Collaboration;
            dd.collection = data.collectionId as unknown as Collection;
            dd.wallet = data.walletId as unknown as Wallet;
            return await this.collaborationRepository.save(dd);
        } catch (e) {
            // FIXME: This ain't always true :issou:
            // Add Sentry capture here.
            console.log(e);
            throw new GraphQLError(`wallet ${data.walletId} is already collaborating with collection ${data.collectionId}`);
        }
    }
}
