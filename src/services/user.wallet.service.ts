import { Injectable } from '@nestjs/common';
import { VUserWalletInfo, VIPriceType } from '../auth/auth.dto';
import { VUpdateUserWalletReqDto, VUserFollowingListReqDto, VUserFollowingListRspDto } from '../dto/user.wallet.dto';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter';
import { IAttribute } from '../lib/interfaces/main.interface';
import {
    UserWalletFollowing,
    UserWallet,
    TbUserWallet,
    TbUserWalletFollowing,
    TbPreMintRecord,
    TbPreMint,
} from '../lib/modules/db.module';
import { TotalRecord, UserFollowingRec, TokenPrice } from '../lib/modules/db.record.module';
import { v4 as uuidV4 } from 'uuid';
import { AuthPayload } from '../auth/auth.service';

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
        if (isFollowed == undefined) isFollowed = true;

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
    async getAddressInfo(address: string, payload?: AuthPayload): Promise<VUserWalletInfo> {
        const info = await this.getUserWalletInfo(address);
        if (!info) throw new Error('address not found');

        if (payload) {
            // if login
            // get your own information, will not show isFollow
            if (payload.address.toLocaleLowerCase() == address) {
                return info;
            }

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
    async getUserWalletInfo(address: string): Promise<VUserWalletInfo> {
        const userWallet = await this.findOne(address);
        if (!userWallet) return null;

        // get follower count and following count
        const followerCount = await this.countUserFollower(userWallet.id);
        const followingCount = await this.countUserFollowing(userWallet.id);
        const nftHoldingRec = await this.countTotalNft(address);
        const fansCountRec = await this.countTotalFans(address);
        const estimates = (await this.getEstimates(address)) as VIPriceType[];

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
            holding: nftHoldingRec.total,
            fansCount: fansCountRec.total,
            estimatedValues: estimates,
        };
    }

    /**
     *
     * @param id The address corresponds to the primary key in the database
     * @param p params, which fields you want to update
     * @returns bool, update is success?
     */
    async updateAddresInfo(id: string, p: VUpdateUserWalletReqDto) {
        // generate update params
        const _update: IAttribute[] = [];
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

    async getUserFollowingList(
        args: VUserFollowingListReqDto,
        payload?: AuthPayload
    ): Promise<VUserFollowingListRspDto> {
        const userWallet = await this.findOne(args.address.toLocaleLowerCase());
        if (!userWallet) throw new Error('address not found');

        const rsp: VUserFollowingListRspDto = {
            data: [],
            total: await (await this.countUserFollowingList(userWallet.id)).total,
        };

        const data = await this.findManyUserFollowingList(userWallet.id, args.skip, args.take);
        for (const d of data) {
            const followerCount = await this.countUserFollower(d.id);
            const followingCount = await this.countUserFollowing(d.id);

            let rec: UserWalletFollowing;
            if (payload) {
                rec = await this.findOneUserFollow(payload.id, d.id);
            }
            rsp.data.push({
                name: d.name,
                address: d.address,
                avatar: d.avatar ?? '',
                followingCount: followingCount.total,
                followerCount: followerCount.total,
                isFollowed: rec ? true : false,
            });
        }

        return rsp;
    }

    async getUserFollowerList(
        args: VUserFollowingListReqDto,
        payload?: AuthPayload
    ): Promise<VUserFollowingListRspDto> {
        const userWallet = await this.findOne(args.address.toLocaleLowerCase());
        if (!userWallet) throw new Error('address not found');

        const rsp: VUserFollowingListRspDto = {
            data: [],
            total: await (await this.countUserFollowerList(userWallet.id)).total,
        };

        const data = await this.findManyUserFollowerList(userWallet.id, args.skip, args.take);
        for (const d of data) {
            const followerCount = await this.countUserFollower(d.id);
            const followingCount = await this.countUserFollowing(d.id);
            let rec: UserWalletFollowing;
            if (payload) {
                rec = await this.findOneUserFollow(payload.id, d.id);
            }
            rsp.data.push({
                name: d.name,
                address: d.address,
                avatar: d.avatar ?? '',
                followingCount: followingCount.total,
                followerCount: followerCount.total,
                isFollowed: rec ? true : false,
            });
        }

        return rsp;
    }

    // CRUD: UserWallet
    async findOne(address: string): Promise<UserWallet | undefined> {
        const sqlStr = `SELECT * FROM "${TbUserWallet}" WHERE address=?`;
        const rsp = await this.pgClient.query<UserWallet>(sqlStr, [address.toLowerCase()]);
        return rsp;
    }

    async createOne(address: string, type?: string) {
        const sqlStr = `INSERT INTO "${TbUserWallet}" (id,address,name,"walletType") VALUES(?,?,?,?)`;
        const values: unknown[] = [];
        values.push(uuidV4());
        values.push(address.toLowerCase());
        values.push(address.toLowerCase());
        values.push(type ?? 'metamask');
        const rsp = await this.pgClient.query<UserWallet>(sqlStr, values);
        return rsp;
    }

    async updateOne(id: string, params: IAttribute[]) {
        const _updater: string[] = [];
        const values: unknown[] = [];
        for (const param of params) {
            _updater.push(`"${param.traitType}"=?`);
            values.push(param.value);
        }

        const sqlStr = `UPDATE "${TbUserWallet}" SET ${_updater.join(',')} WHERE id=? `;
        values.push(id);
        const rsp = await this.pgClient.query<UserWallet>(sqlStr, values);
        return rsp;
    }

    // CRUD: UserWalletFollowing
    async findOneUserFollow(wallet: string, following: string) {
        const sqlStr = `SELECT * FROM "${TbUserWalletFollowing}" WHERE wallet = ? AND "followingWallet" = ?`;
        const values: unknown[] = [];
        values.push(wallet);
        values.push(following);
        const rsp = await this.pgClient.query<UserWalletFollowing>(sqlStr, values);
        return rsp;
    }

    async createOneUserFollow(wallet: string, following: string, isFollow: boolean) {
        const sqlStr = `INSERT INTO "${TbUserWalletFollowing}" (id,wallet,"followingWallet","isFollow") VALUES(?,?,?,?)`;
        const values: unknown[] = [];
        values.push(uuidV4());
        values.push(wallet);
        values.push(following);
        values.push(isFollow);
        const rsp = await this.pgClient.query<UserWalletFollowing>(sqlStr, values);
        return rsp;
    }

    async updateOneUserFollow(id: string, isFollow: boolean) {
        const sqlStr = `UPDATE "${TbUserWalletFollowing}" SET "isFollow"=? WHERE id=?`;
        const values: unknown[] = [];
        values.push(isFollow);
        values.push(id);
        console.log(sqlStr);
        const rsp = await this.pgClient.query<UserWalletFollowing>(sqlStr, values);
        return rsp;
    }

    async countUserFollower(id: string) {
        const sqlStr = `SELECT COUNT(*) AS total FROM "${TbUserWalletFollowing}" WHERE "followingWallet"=? and "isFollow"=true`;
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [id]);
        return rsp;
    }

    async countUserFollowing(id: string) {
        const sqlStr = `SELECT COUNT(*) AS total FROM "${TbUserWalletFollowing}" WHERE wallet=? and "isFollow"=true`;
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [id]);
        return rsp;
    }

    async findManyUserFollowingList(id: string, offset?: number, limit?: number) {
        let sqlStr = `
        SELECT
            uw.id,uw.address,uw.avatar,uw."name"
        FROM
            "UserWalletFollowing" AS uwf
        LEFT JOIN
            "UserWallet" AS uw
        ON
            uw.id =uwf."followingWallet"
        WHERE
            uwf.wallet=?
        AND
            uwf."isFollow"=true `;
        const values: unknown[] = [];
        values.push(id);
        if (offset) {
            sqlStr = `${sqlStr} OFFSET ${offset}`;
            values.push(offset);
        }
        if (limit) {
            sqlStr = `${sqlStr} LIMIT ${limit}`;
            values.push(limit);
        }
        const rsp = await this.pgClient.select<UserFollowingRec>(sqlStr, values);
        return rsp;
    }

    async countUserFollowingList(id: string) {
        const sqlStr = `
        SELECT
            COUNT(*) AS total
        FROM
            "UserWalletFollowing" AS uwf
        LEFT JOIN
            "UserWallet" AS uw
        ON
            uw.id =uwf."followingWallet"
        WHERE
            uwf.wallet=?
        AND
            uwf."isFollow"=true `;
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [id]);
        return rsp;
    }

    async findManyUserFollowerList(id: string, offset?: number, limit?: number) {
        let sqlStr = `
        SELECT
            uw.id,uw.address,uw.avatar,uw."name"
        FROM
            "UserWalletFollowing" AS uwf
        LEFT JOIN
            "UserWallet" AS uw
        ON
            uw.id =uwf.wallet
        WHERE
            uwf."followingWallet"=?
        AND
            uwf."isFollow"=true`;
        const values: unknown[] = [];
        values.push(id);
        if (offset) {
            sqlStr = `${sqlStr} OFFSET ${offset}`;
            values.push(offset);
        }
        if (limit) {
            sqlStr = `${sqlStr} LIMIT ${limit}`;
            values.push(limit);
        }
        const rsp = await this.pgClient.select<UserFollowingRec>(sqlStr, values);
        return rsp;
    }

    async countUserFollowerList(id: string) {
        const sqlStr = `
        SELECT
            COUNT(*) AS total
        FROM
            "UserWalletFollowing" AS uwf
        LEFT JOIN
            "UserWallet" AS uw
        ON
            uw.id =uwf.wallet
        WHERE
            uwf."followingWallet"=?
        AND
            uwf."isFollow"=true`;
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [id]);
        return rsp;
    }

    // CRUD: Other
    async countTotalNft(address: string) {
        const sqlStr = `SELECT COUNT(*) AS total FROM "${TbPreMintRecord}" WHERE recipient = ?`;
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [address]);
        return rsp;
    }

    async countTotalFans(address: string) {
        const sqlStr = `SELECT COUNT(DISTINCT(pmr.recipient)) AS total FROM "${TbPreMintRecord}" AS pmr LEFT JOIN "${TbPreMint}" AS pm ON pmr.contract=pm.contract AND pmr.tier=pm.tier WHERE pm."owner"=?`;
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [address]);
        return rsp;
    }

    async getEstimates(address: string) {
        const sqlStr = `
        SELECT
            pmr.payment_token AS token,SUM(pmr.price::decimal(30,0)) AS price
        FROM
            pre_mint AS pm
        LEFT JOIN
            pre_mint_record AS pmr
        ON
            pm.contract=pmr.contract
        AND
            pm.tier=pmr.tier
        WHERE
            pmr.id IS NOT NULL
        AND
            pm."owner"=?
        GROUP BY
            pmr.payment_token`;
        const rsp = await this.pgClient.select<TokenPrice>(sqlStr, [address]);
        return rsp;
    }
}
