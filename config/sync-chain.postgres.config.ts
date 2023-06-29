import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const syncChainPostgresConfig = {
    type: 'postgres',
    migrationsTableName: 'migrations',
    logging: true,
    synchronize: false,
    name: 'sync_chain',
    entities: ['src/sync-chain/*/*.entity{.ts,.js}'],
    migrations: ['src/sync-chain/migrations/*{.ts,.js}'],
    url: process.env.SYNC_CHAIN_DATABASE_URL,
};

export default new DataSource(syncChainPostgresConfig as PostgresConnectionOptions);
