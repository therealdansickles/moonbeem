import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MetadataProperty, Tier } from '../tier/tier.entity';
import { AWSAdapter, ResourceType } from '../lib/adapters/aws.adapter';
import { Collection } from '../collection/collection.entity';
import { omit } from 'lodash';
import { appConfig } from '../lib/configs/app.config';

export interface IMetadataForOpensea {
    id: string;
    collection_id: string;
    token_id: string;

    name: string;
    description: string;
    image: string;
    external_url: string;
    properties: { [key: string]: MetadataProperty };
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
                    collection_id: collection.id,
                    token_id: record.tokenId,
                    name: tier?.name,
                    description: tier?.description,
                    image: tier?.image,
                    external_url: tier?.externalUrl,
                    properties: tier.metadata.properties,
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

    @Cron(CronExpression.EVERY_30_SECONDS, { disabled: appConfig.cron.disabled })
    async handle() {
        const records = await this.getSaleRecord();
        const ids = [];
        for (const record of records) {
            const baseUrlId = `${record.collection_id}/${record.token_id}`;
            await this.upload(baseUrlId, omit(record, ['id', 'collection_id', 'token_id']));
            ids.push(record.id);
        }
        await this.markIsUploaded(ids);
    }
}
