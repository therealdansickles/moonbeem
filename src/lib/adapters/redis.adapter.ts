import { createClient } from 'redis';
import { redisConfig } from '../configs/db.config.js';

export class RedisAdapter {
    private client;

    constructor() {
        this.connect();
    }

    async connect() {
        this.client = createClient({ url: redisConfig.url });
        this.client.on('error', (err) => console.log('Redis Client Error', err));
        await this.client.connect();
    }

    getKey(k: string, prefix?: string) {
        if (!prefix) {
            prefix = process.env.CHAIN ?? 'mainnet';
        }
        return `${prefix}_${k}`;
    }

    async set(k: string, value: any, seconds?: number) {
        value = JSON.stringify(value);
        if (!seconds) {
            this.client.set(k, value);
        } else {
            this.client.set(k, value, { EX: seconds });
        }
    }

    async get(k: string) {
        var data = await this.client.get(k);
        if (!data) return;
        return JSON.parse(data);
    }

    async delete(k: string) {
        await this.client.del(k);
    }
}
