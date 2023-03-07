import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MetadataUploadPoller } from '../pollers/metadata.poller.js';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter.js';
import { RedisAdapter } from '../lib/adapters/redis.adapter.js';
import { AWSAdapter } from '../lib/adapters/aws.adapter.js';
import { MongoAdapter } from '../lib/adapters/mongo.adapter.js';

@Injectable()
export class PollerService {
    constructor(private readonly pgClient: PostgresAdapter, private readonly redisClient: RedisAdapter, private readonly aws: AWSAdapter, private readonly mongoClient: MongoAdapter) {}

    @Cron('0 * * * * *')
    handleCron() {
        console.log(`Schedule Debug: ${Date.now()}`);
    }

    @Cron('*/30 * * * * *')
    async uploadMetadata() {
        let uploader = new MetadataUploadPoller(this.pgClient, this.redisClient, this.aws, this.mongoClient);
        await uploader.do();
    }
}
