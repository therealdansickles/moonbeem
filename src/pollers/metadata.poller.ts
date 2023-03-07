import { MongoAdapter } from '../lib/adapters/mongo.adapter.js';
import { AWSAdapter, ResourceType } from '../lib/adapters/aws.adapter.js';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter.js';
import { RedisAdapter } from '../lib/adapters/redis.adapter.js';
import { MetadataPollerItem } from '../lib/modules/db.record.module.js';
import { IMetadata } from '../lib/modules/db.mongo.module.js';

export class MetadataUploadPoller {
    constructor(private readonly pgClient: PostgresAdapter, private readonly redisClient: RedisAdapter, private readonly aws: AWSAdapter, private readonly mongoClient: MongoAdapter) {
        console.log(`Metadata Poller Start On ${Date.now()}`)
    }

    redisKey(str: string) {
        return `metadata_json_upload_${str}`;
    }

    async getSaleRecord() {
        let sqlStr = `
        SELECT
            c.id,c.collection,c.uniq_id,pm.tier,pm.start_id,pm.end_id,pm.current_id
        FROM
            collection AS c
        LEFT JOIN
            pre_mint AS pm
        ON
            c.collection=pm.contract
        WHERE
            c.collection != ''
        AND
            pm.current_id > pm.start_id
        `;

        const rsp = await this.pgClient.select<MetadataPollerItem>(sqlStr, []);
        return rsp;
    }

    async getUploadRecord(uniq_id: string) {
        const redisVal = await this.redisClient.get(this.redisKey(uniq_id));
        if (redisVal) return redisVal;
    }

    async saveUploadRecord(uniq_id: string, str: MetadataPollerItem) {
        await this.redisClient.set(this.redisKey(uniq_id), str);
    }

    async upload(uniq_id: string, id: number, content: any) {
        const buf = Buffer.from(JSON.stringify(content, null, 2));

        // TODO: check if `.json` suffix is required --> `${uniq_id}/${id}.json`
        const url = await this.aws.s3PutData(buf, `${uniq_id}/${id}`, ResourceType.Metadata, 'application/json');
        return url;
    }

    async getMetadata(collectionId: string, tierId: number): Promise<IMetadata> {
        const metaCol = this.mongoClient.db.collection('metadata');
        const r = (await metaCol.findOne({ 'vibe_properties.collection': collectionId, 'vibe_properties.tier_id': tierId })) as unknown as IMetadata | null;
        return r;
    }

    async handler(item: MetadataPollerItem) {
        let uploadRecord = await this.getUploadRecord(item.uniq_id);
        let meta = await this.getMetadata(item.id, item.tier);

        let attrs: IAttributeForOpensea[] = [];
        for (let i of meta.attributes) {
            let attr: IAttributeForOpensea = {
                trait_type: i.trait_type,
                value: i.value,
            };
            if (i.display_type) attr.display_type = i.display_type;
            attrs.push(attr);
        }

        let metadata: IMetadataForOpensea = {
            token: item.collection,
            token_id: '',
            name: meta.name,
            description: meta.description,
            image: meta.image,
            external_url: meta.external_url,
            attributes: attrs,
        };
        if (!uploadRecord) {
            // Maybe new item
            if (item.current_id - item.start_id > 0) {
                for (let idx = 0; idx < item.current_id - item.start_id; idx++) {
                    metadata.token_id = (item.start_id + idx).toString();
                    let url = await this.upload(item.uniq_id, item.start_id + idx, metadata);
                    console.log(`url: ${url}`);
                }
            }
        } else {
            // Check if all uploads are finish
            if (item.current_id == uploadRecord.current_id) return;

            // Upload the remaining parts
            for (let idx = 0; idx < item.current_id - uploadRecord.current_id; idx++) {
                metadata.token_id = (item.start_id + idx).toString();
                let url = await this.upload(item.uniq_id, uploadRecord.current_id + idx, metadata);
                console.log(`url: ${url}`);
            }
        }

        await this.saveUploadRecord(item.uniq_id, item);
    }

    async do() {
        const srs = await this.getSaleRecord();
        if (!srs) return;

        for (let sr of srs) {
            await this.handler(sr);
        }
    }
}

// metadata standards for opensea, see: https://docs.opensea.io/docs/metadata-standards
export interface IMetadataForOpensea {
    token: string;
    token_id: string;
    name: string;
    description: string;
    image: string;
    external_url: string;
    attributes: IAttributeForOpensea[];
}

export interface IAttributeForOpensea {
    trait_type: string;
    value: any;
    display_type?: string;
}
