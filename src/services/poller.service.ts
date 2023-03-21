import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AWSAdapter } from '../lib/adapters/aws.adapter';
import { MongoAdapter } from '../lib/adapters/mongo.adapter';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter';
import { RedisAdapter } from '../lib/adapters/redis.adapter';
import { appConfig } from '../lib/configs/app.config';
import { MetadataUploadPoller } from '../pollers/metadata.poller';

@Injectable()
export class PollerService {
    constructor(private readonly pgClient: PostgresAdapter, private readonly redisClient: RedisAdapter, private readonly aws: AWSAdapter, private readonly mongoClient: MongoAdapter) {}

    @Cron('0 * * * * *', {
        disabled: appConfig.cron.disabled,
    })
    handleCron() {
        console.log(`Schedule Debug: ${Date.now()}`);
    }

    @Cron('*/30 * * * * *', {
        disabled: appConfig.cron.disabled,
    })
    async uploadMetadata() {
        const uploader = new MetadataUploadPoller(this.pgClient, this.redisClient, this.aws, this.mongoClient);
        await uploader.do();
    }
}
