import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// we can use this one to replace `lib/configs/db.config.ts`
// but for now, let's split the config into two files
// if migrate works, i can do the refactor it soon
export default new DataSource({
    type: 'postgres',
    migrationsTableName: 'migrations',
    logging: true,
    synchronize: false,
    name: 'default',
    entities: ['src/*/*.entity{.ts,.js}'],
    migrations: ['./migrations/*{.ts,.js}'],
    url: process.env.DATABASE_URL,
});
