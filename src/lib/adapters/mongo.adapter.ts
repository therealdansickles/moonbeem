import { mongoConfig } from '../configs/db.config';
import { Db, MongoClient } from 'mongodb';

export class MongoAdapter {
    public db: Db;

    constructor() {
        this.getPGConnection();
    }

    private async getPGConnection() {
        const client = new MongoClient(mongoConfig.url);
        await client.connect();
        this.db = client.db(mongoConfig.db);
    }
}
