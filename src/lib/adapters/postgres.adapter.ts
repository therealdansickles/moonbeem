import { Sequelize } from 'sequelize';
import { postgresConfig } from '../configs/db.config';

export class PostgresAdapter {
    private db;

    constructor() {
        this.getPGConnection();
    }

    async getPGConnection() {
        this.db = await new Sequelize(postgresConfig.url, {
            pool: {
                max: 5,
                min: 0,
            },
            logging: process.env.NODE_ENV === 'dev' ?? false,
        });
    }

    async query<T>(sqlStr: string, values?: any[]) {
        if (!values) values = [];
        const res = (await this.db.query({ query: sqlStr, values: values }))[0] as T[];
        return res[0];
    }

    async get<T>(sqlStr: string, values?: any[]) {
        const res = await this.select<T>(sqlStr, values);
        return res[0];
    }

    async select<T>(sqlStr: string, values?: any[]) {
        if (!values) values = [];
        const res = (await this.db.query({ query: sqlStr, values: values }))[0] as T[];
        return res;
    }
}
