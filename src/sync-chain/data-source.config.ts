import { DataSource } from 'typeorm';

// we can use this one to replace `lib/configs/db.config.ts`
// but for now, let's split the config into two files
// if migrate works, i can do the refactor it soon
export default new DataSource({
    type: 'postgres',
    migrationsTableName: 'migrations',
    logging: true,
    synchronize: false,
    name: 'sync_chain',
    entities: ['src/sync-chain/*/*.entity{.ts,.js}'],
    migrations: ['src/sync-chain/migrations/*{.ts,.js}'],
    url: process.env.SYNC_CHAIN_DATABASE_URL,
});
