import { DataSource } from 'typeorm';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

export const platformPostgresConfig = {
    type: 'postgres',
    migrationsTableName: 'migrations',
    logging: true,
    synchronize: false,
    name: 'default',
    entities: ['src/*/*.entity{.ts,.js}'],
    migrations: ['src/migrations/*{.ts,.js}'],
    autoLoadEntities: true,
    url: process.env.V1_DATABASE_URL,
};

export default new DataSource(platformPostgresConfig as PostgresConnectionOptions);
