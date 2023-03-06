import { Module } from '@nestjs/common';
import { AWSAdapter } from '../lib/adapters/aws.adapter.js';
import { MongoAdapter } from '../lib/adapters/mongo.adapter.js';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter.js';
import { RedisAdapter } from '../lib/adapters/redis.adapter.js';
import { EthereumAddress } from '../lib/scalars/eth.scalar.js';

@Module({
    imports: [],
    controllers: [],
    providers: [PostgresAdapter, RedisAdapter, MongoAdapter, AWSAdapter, EthereumAddress],
    exports: [PostgresAdapter, RedisAdapter, MongoAdapter, AWSAdapter],
})
export class SharedModule {}
