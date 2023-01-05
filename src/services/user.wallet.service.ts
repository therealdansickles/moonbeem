import { Injectable } from '@nestjs/common';
import { throws } from 'assert';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { v4 as uuidV4 } from 'uuid';

export interface UserWallet {
    id: string;
    address: string;
    name: string;
    avatar: string;
    createdTime: string;
    updatedTime: string;
    user: string;
    banner: string;
    customUrl: string;
    description: string;
    discordLink: string;
    facebookLink: string;
    twitterLink: string;
    collection: string;
    walletType: string;
    visible: boolean;
}

@Injectable()
export class UserWalletService {
    constructor(private readonly pgClient: PostgresAdapter) {}

    async findOne(address: string): Promise<UserWallet | undefined> {
        let sqlStr = `SELECT * FROM "UserWallet" WHERE address=?`;
        const rsp = await this.pgClient.query<UserWallet>(sqlStr, [address.toLowerCase()]);
        return rsp;
    }

    async createOne(address: string, type?: string) {
        let sqlStr = `INSERT INTO "UserWallet" (id,address,name,"walletType") VALUES(?,?,?,?)`;
        let values: any[] = [];
        values.push(uuidV4());
        values.push(address.toLowerCase());
        values.push(address.toLowerCase());
        values.push(type ?? 'metamask');
        const rsp = await this.pgClient.query<UserWallet>(sqlStr, values);
        return rsp;
    }
}
