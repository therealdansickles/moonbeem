export const redisConfig = {
    url: process.env.REDIS_URL,
};

export const postgresConfig = {
    url: process.env.DATABASE_URL,
};

export const mongoConfig = {
    url: process.env.MONGO_URL,
    db: process.env.MONGO_DATABASE || 'keystone',
};
