import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

export const postgresConfig = {
    url: process.env.DATABASE_URL,
    syncChain: {
        url: process.env.SYNC_CHAIN_DATABASE_URL,
    },
};
