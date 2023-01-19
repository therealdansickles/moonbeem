import { Module } from '@nestjs/common';
import { MongoAdapter } from 'src/lib/adapters/mongo.adapter';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { RedisAdapter } from 'src/lib/adapters/redis.adapter';
import { EthereumAddress } from 'src/lib/scalars/eth.scalar';

@Module({
    imports: [],
    controllers: [],
    providers: [PostgresAdapter, RedisAdapter, MongoAdapter, EthereumAddress],
    exports: [PostgresAdapter, RedisAdapter, MongoAdapter],
})
export class SharedModule {}
