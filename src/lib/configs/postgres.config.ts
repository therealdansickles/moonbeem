import { DataSource } from 'typeorm';

// we can use this one to replace `lib/configs/db.config.ts`
// but for now, let's split the config into two files
// if migrate works, i can do the refactor it soon
export default new DataSource({
    type: 'postgres',
    host: process.env.V1_DATABASE_HOST,
    port: process.env.V1_DATABASE_PORT ? parseInt(process.env.V1_DATABASE_PORT) : 5432,
    username: process.env.V1_DATABASE_USERNAME,
    password: process.env.V1_DATABASE_PASSWORD,
    database: process.env.V1_DATABASE_NAME,
    migrationsTableName: 'migrations',
    logging: true,
    synchronize: false,
    name: 'default',
    entities: ['src/*/*.entity{.ts,.js}'],
    migrations: ['./migrations/*{.ts,.js}'],
});
