import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, MoreThan, Repository } from 'typeorm';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Tier } from '../tier/tier.entity';
import { RedisAdapter } from '../lib/adapters/redis.adapter';
import { MetadataPollerItem } from 'src/lib/modules/db.record.module';
import { AWSAdapter, ResourceType } from '../lib/adapters/aws.adapter';
import { Collection } from '../collection/collection.entity';
import { omit } from 'lodash';

export interface IMetadataForOpensea {
    id: string;
    token: string;
    token_id: string;
    collection_id: string;
    name: string;
    description: string;
    image: string;
    external_url: string;
    attributes: IAttributeForOpensea[];
}

export interface IAttributeForOpensea {
    trait_type: string;
    value: unknown;
    display_type?: string;
}

@Injectable()
export class PollerService {
    constructor(
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private readonly mintSaleTransactionRepository: Repository<MintSaleTransaction>,
        @InjectRepository(Collection)
        private readonly collectionRepository: Repository<Collection>,
        @InjectRepository(Tier)
        private readonly tierRepository: Repository<Tier>,
        private readonly aws: AWSAdapter
    ) {}

    async getSaleRecord() {
        const records: MintSaleTransaction[] = await this.mintSaleTransactionRepository.findBy({ isUploaded: false });

        const result: Array<IMetadataForOpensea> = [];
        for (const record of records) {
            const collection = await this.collectionRepository.findOneBy({ address: record.address.toLowerCase() });
            if (collection) {
                const tier = await this.tierRepository.findOneBy({
                    tierId: record.tierId,
                    collection: { id: collection.id },
                });
                result.push({
                    id: record.id,
                    token: record.address,
                    token_id: record.tokenId,
                    collection_id: collection.id,
                    name: tier?.name,
                    description: tier?.description,
                    image: tier?.image,
                    external_url: tier?.externalUrl,
                    attributes: JSON.parse(tier?.attributes),
                });
            }
        }
        return result;
    }

    async markIsUploaded(ids: string[]) {
        await this.mintSaleTransactionRepository.update({ id: In(ids) }, { isUploaded: true });
    }

    async upload(id: string, content: unknown) {
        const buf = Buffer.from(JSON.stringify(content, null, 2));
        const url = await this.aws.s3PutData(buf, id, ResourceType.Metadata, 'application/json');
        return url;
    }

    @Cron(CronExpression.EVERY_30_SECONDS)
    async handle() {
        const records = await this.getSaleRecord();
        const ids = [];
        for (let record of records) {
            const baseUrlId = `${record.collection_id}/${record.token_id}`;
            await this.upload(baseUrlId, omit(record, ['id', 'collection_id']));
            ids.push(record.id);
        }
        await this.markIsUploaded(ids);
    }
}
