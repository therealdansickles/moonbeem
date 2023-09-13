import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

export const postgresConfig = {
    url: process.env.V1_DATABASE_URL,
    host: process.env.V1_DATABASE_HOST,
    port: process.env.V1_DATABASE_PORT ? parseInt(process.env.V1_DATABASE_PORT) : 5432,
    username: process.env.V1_DATABASE_USERNAME,
    password: process.env.V1_DATABASE_PASSWORD,
    database: process.env.V1_DATABASE_NAME,
    syncChain: {
        url: process.env.SYNC_CHAIN_DATABASE_URL,
        host: process.env.SYNC_CHAIN_DATABASE_HOST,
        port: process.env.SYNC_CHAIN_DATABASE_PORT ? parseInt(process.env.SYNC_CHAIN_DATABASE_PORT) : 5432,
        username: process.env.SYNC_CHAIN_DATABASE_USERNAME,
        password: process.env.SYNC_CHAIN_DATABASE_PASSWORD,
        database: process.env.SYNC_CHAIN_DATABASE_NAME,
    },
};
