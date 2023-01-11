import { Injectable } from '@nestjs/common';
import { UserWalletInfo } from 'src/dto/auth.dto';
import { UpdateUserWalletReqDto } from 'src/dto/user.wallet.dto';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { IAttribute } from 'src/lib/interfaces/main.interface';
import { TbUserWallet, TbUserWalletFollowing, UserWallet, UserWalletFollowing } from 'src/lib/modules/db.module';
import { TotalRecord } from 'src/lib/modules/db.record.module';
import { v4 as uuidV4 } from 'uuid';
import { AuthPayload } from './auth.service';

@Injectable()
export class UserWalletService {
    constructor(private readonly pgClient: PostgresAdapter) {}

    /**
     *
     * @param follower follower as AuthPayload, it mean you must to login, follower mean you owner
     * @param address followed, it mean the follower want to follow this address
     * @param isFollowed if true, it mean follow. it false it mean unfollow
     * @returns follow is success?
     */
    async followUserWallet(follower: AuthPayload, address: string, isFollowed?: boolean) {
        if (follower.address === address) throw new Error('can not follow yourself');

        // check address is exists
        const wallet = await this.findOne(address);
        if (!wallet) throw new Error('address not found');

        // check userFollowing record
        const rec = await this.findOneUserFollow(follower.id, wallet.id);

        if (!rec) {
            // if he is not following, but unfollowing
            if (!isFollowed) return true;

            // if he is following, create record
            await this.createOneUserFollow(follower.id, wallet.id, isFollowed);
            return true;
        } else {
            // the same as db
            if (rec.isFollow === isFollowed) return true;
            // not the same as db
            await this.updateOneUserFollow(rec.id, isFollowed);
            return true;
        }
    }

    /**
     *
     * @param address User wallet address, eth address
     * @param payload User authorization basic information, if nologin will be undefined
     * @returns User wallet info, if login, will return isFollow, else not
     */
    async getAddressInfo(address: string, payload?: AuthPayload): Promise<UserWalletInfo> {
        const info = await this.getUserWalletInfo(address);
        if (!info) throw new Error('address not found');

        if (payload) {
            // if login
            // get your own information, will not show isFollow
            if (payload.address.toLocaleLowerCase() == address) return info;

            // get other address information, check if records are available
            const row = await this.findOneUserFollow(payload.id, info.id);
            row ? (info.isFollow = true) : (info.isFollow = false);
        } else {
            // if nologin
            info.isFollow = false;
        }

        return info;
    }

    /**
     *
     * @param address user address
     * @returns user wallet info
     */
    async getUserWalletInfo(address: string): Promise<UserWalletInfo> {
        let userWallet = await this.findOne(address);
        if (!userWallet) return null;

        // get follower count and following count
        const followerCount = await this.countUserFollower(userWallet.id);
        const followingCount = await this.countUserFollowing(userWallet.id);

        return {
            id: userWallet.id,
            address: userWallet.address,
            name: userWallet.name,
            avatar: userWallet.avatar,
            customUrl: userWallet.customUrl,
            description: userWallet.description,
            discordLink: userWallet.discordLink,
            facebookLink: userWallet.facebookLink,
            twitterLink: userWallet.twitterLink,
            followerCount: followerCount.total,
            followingCount: followingCount.total,
        };
    }

    /**
     *
     * @param id The address corresponds to the primary key in the database
     * @param p params, which fields you want to update
     * @returns bool, update is success?
     */
    async updateAddresInfo(id: string, p: UpdateUserWalletReqDto) {
        // generate update params
        let _update: IAttribute[] = [];
        if (p.name != undefined) {
            if (p.name == '') throw new Error('name can not be null');
            _update.push({ traitType: 'name', value: p.name });
        }
        if (p.avatar != undefined) _update.push({ traitType: 'avatar', value: p.avatar });
        if (p.customUrl != undefined) _update.push({ traitType: 'customUrl', value: p.customUrl });
        if (p.description != undefined) _update.push({ traitType: 'description', value: p.description });
        if (p.discordLink != undefined) _update.push({ traitType: 'discordLink', value: p.discordLink });
        if (p.facebookLink != undefined) _update.push({ traitType: 'facebookLink', value: p.facebookLink });
        if (p.twitterLink != undefined) _update.push({ traitType: 'twitterLink', value: p.twitterLink });

        if (_update.length == 0) throw new Error('params undefined');
        await this.updateOne(id, _update);
        return true;
    }

    // CRUD: UserWallet
    async findOne(address: string): Promise<UserWallet | undefined> {
        let sqlStr = `SELECT * FROM "${TbUserWallet}" WHERE address=?`;
        const rsp = await this.pgClient.query<UserWallet>(sqlStr, [address.toLowerCase()]);
        return rsp;
    }

    async createOne(address: string, type?: string) {
        let sqlStr = `INSERT INTO "${TbUserWallet}" (id,address,name,"walletType") VALUES(?,?,?,?)`;
        let values: any[] = [];
        values.push(uuidV4());
        values.push(address.toLowerCase());
        values.push(address.toLowerCase());
        values.push(type ?? 'metamask');
        const rsp = await this.pgClient.query<UserWallet>(sqlStr, values);
        return rsp;
    }

    async updateOne(id: string, params: IAttribute[]) {
        let _updater: string[] = [];
        let values: any[] = [];
        for (let param of params) {
            _updater.push(`"${param.traitType}"=?`);
            values.push(param.value);
        }

        let sqlStr = `UPDATE "${TbUserWallet}" SET ${_updater.join(',')} WHERE id=? `;
        values.push(id);
        const rsp = await this.pgClient.query<UserWallet>(sqlStr, values);
        return rsp;
    }

    // CRUD: UserWalletFollowing
    async findOneUserFollow(wallet: string, following: string) {
        let sqlStr = `SELECT * FROM "${TbUserWalletFollowing}" WHERE wallet = ? AND "followingWallet" = ?`;
        let values: any[] = [];
        values.push(wallet);
        values.push(following);
        const rsp = await this.pgClient.query<UserWalletFollowing>(sqlStr, values);
        return rsp;
    }

    async createOneUserFollow(wallet: string, following: string, isFollow: boolean) {
        let sqlStr = `INSERT INTO "${TbUserWalletFollowing}" (id,wallet,"followingWallet","isFollow") VALUES(?,?,?,?)`;
        let values: any[] = [];
        values.push(uuidV4());
        values.push(wallet);
        values.push(following);
        values.push(isFollow);
        const rsp = await this.pgClient.query<UserWalletFollowing>(sqlStr, values);
        return rsp;
    }

    async updateOneUserFollow(id: string, isFollow: boolean) {
        let sqlStr = `UPDATE "${TbUserWalletFollowing}" SET "isFollow"=? WHERE id=?`;
        let values: any[] = [];
        values.push(isFollow);
        values.push(id);
        const rsp = await this.pgClient.query<UserWalletFollowing>(sqlStr, values);
        return rsp;
    }

    async countUserFollower(id: string) {
        let sqlStr = `SELECT COUNT(*) AS total FROM "${TbUserWalletFollowing}" WHERE "followingWallet"=? and "isFollow"=true`;
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [id]);
        return rsp;
    }

    async countUserFollowing(id: string) {
        let sqlStr = `SELECT COUNT(*) AS total FROM "${TbUserWalletFollowing}" WHERE wallet=? and "isFollow"=true`;
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [id]);
        return rsp;
    }
}
