import { Module } from '@nestjs/common';
import { AWSAdapter } from '../lib/adapters/aws.adapter';
import { MongoAdapter } from '../lib/adapters/mongo.adapter';
import { RedisAdapter } from '../lib/adapters/redis.adapter';
import { EthereumAddress } from '../lib/scalars/eth.scalar';

@Module({
    imports: [],
    controllers: [],
    providers: [RedisAdapter, MongoAdapter, AWSAdapter, EthereumAddress],
    exports: [RedisAdapter, MongoAdapter, AWSAdapter],
})
export class SharedModule {}
