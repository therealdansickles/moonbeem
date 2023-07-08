import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Update } from './nftActivity.entity';
import { v4 as uuidv4 } from 'uuid';
import { NftService } from '../nft/nft.service';
import { CollectionService } from '../collection/collection.service';
import { Collection } from '../collection/collection.dto';
@Injectable()
export class NftActivityService {
    constructor(
        @InjectRepository(Update)
        private readonly updateRepository: Repository<Update>,
        private readonly collectionService: CollectionService,
        private readonly nftService: NftService
    ) {}

    async createActivity(body: any): Promise<Update> {
        await this.createOrUpdateNft(body);
        const newUpdate: Update = {
            addressCollection: body.event.activity[0].fromAddress,
            timeStamp: body.createdAt,
            id: uuidv4()
        }

        return await this.insertEventFromAlchemy(newUpdate);
    }

    async createOrUpdateNft(body: any) {
        let collecion: Collection;
        body.event.activity.forEach(async (activity) => {
            collecion = await this.collectionService.getCollectionByAddress(activity.contractAddress);
            console.log(activity, activity.erc1155Metadata.tokenId)
            const NftByToke = {
                collectionId: collecion.id,
                //TODO: we do not know how to get tierID from alchemy webhook
                tierId: collecion.tiers[0].id,
                tokenId: activity.erc1155Metadata[0].tokenId,
                properties: {
                    foo: 'from alchemy',
                }
            };
            await this.nftService.createOrUpdateNftByTokenId(NftByToke);
        });
    }

    async insertEventFromAlchemy(payload: Partial<Update>): Promise<Update> {
        await this.updateRepository.insert(payload);
        return await this.updateRepository.findOneBy({ id: payload.id });
    }
}
