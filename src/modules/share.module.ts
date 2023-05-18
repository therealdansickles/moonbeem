import { Module } from '@nestjs/common';
import { AWSAdapter } from '../lib/adapters/aws.adapter';
import { MongoAdapter } from '../lib/adapters/mongo.adapter';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter';
import { RedisAdapter } from '../lib/adapters/redis.adapter';
import { EthereumAddress } from '../lib/scalars/eth.scalar';
import { ProfileNFTAdapter } from '../lib/adapters/profile.nft.adapter';

@Module({
    imports: [],
    controllers: [],
    providers: [PostgresAdapter, RedisAdapter, MongoAdapter, AWSAdapter, EthereumAddress, ProfileNFTAdapter],
    exports: [PostgresAdapter, RedisAdapter, MongoAdapter, AWSAdapter, ProfileNFTAdapter],
})
export class SharedModule {}
