import { Module } from '@nestjs/common';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { RedisAdapter } from 'src/lib/adapters/redis.adapter';

@Module({
    imports: [],
    controllers: [],
    providers: [PostgresAdapter, RedisAdapter],
    exports: [PostgresAdapter, RedisAdapter],
})
export class SharedModule {}
