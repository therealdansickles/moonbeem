import { Module } from '@nestjs/common';
import { AWSAdapter } from '../lib/adapters/aws.adapter';
import { RedisAdapter } from '../lib/adapters/redis.adapter';
import { EthereumAddress } from '../lib/scalars/eth.scalar';

@Module({
    imports: [],
    controllers: [],
    providers: [RedisAdapter, AWSAdapter, EthereumAddress],
    exports: [RedisAdapter, AWSAdapter],
})
export class SharedModule {}
