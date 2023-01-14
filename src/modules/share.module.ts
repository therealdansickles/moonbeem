import { Module } from '@nestjs/common';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { RedisAdapter } from 'src/lib/adapters/redis.adapter';
import { EthereumAddress } from 'src/lib/scalars/eth.scalar';

@Module({
    imports: [],
    controllers: [],
    providers: [PostgresAdapter, RedisAdapter, EthereumAddress],
    exports: [PostgresAdapter, RedisAdapter],
})
export class SharedModule {}
