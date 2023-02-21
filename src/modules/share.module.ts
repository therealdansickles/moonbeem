import { Module } from '@nestjs/common';
import { MongoAdapter } from '../lib/adapters/mongo.adapter.js';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter.js';
import { RedisAdapter } from '../lib/adapters/redis.adapter.js';
import { EthereumAddress } from '../lib/scalars/eth.scalar.js';

@Module({
    imports: [],
    controllers: [],
    providers: [PostgresAdapter, RedisAdapter, MongoAdapter, EthereumAddress],
    exports: [PostgresAdapter, RedisAdapter, MongoAdapter],
})
export class SharedModule {}
