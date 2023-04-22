import { Injectable } from '@nestjs/common';
import {
    BasicWalletInfo,
    BasicCollectionInfo,
    BasicCollectionRoyaltyInfo,
    BasicFloorPriceInfo,
    BasicTierInfo,
    BasicAttributeInfo,
    BasicCollectionStatus,
    BasicPriceInfo,
} from '../dto/basic.dto';
import {
    LandingPageCollectionReqDto,
    LandingPageCollectionRspDto,
    LandingPageRankingOfCreatorsReqDto,
    LandingPageRankingOfCreatorsRspDto,
    LandingPageRankingOfItemsReqDto,
    LandingPageRankingOfItemsRspDto,
} from '../dto/landing.dto';
import { MongoAdapter } from '../lib/adapters/mongo.adapter';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter';
import { ITier, IPreMint, IAttributeOverview } from '../lib/interfaces/main.interface';
import {
    LandingPageCollectionItem,
    TotalRecord,
    LandingPageRankingOfCreatorItem,
    LandingPageRankingOfItemItem,
} from '../lib/modules/db.record.module';

@Injectable()
export class LandingService {
    constructor(private readonly pgClient: PostgresAdapter, private readonly mongoClient: MongoAdapter) {}

    async getLandingPageCollections(args: LandingPageCollectionReqDto): Promise<LandingPageCollectionRspDto> {
        const rsp: LandingPageCollectionRspDto = {
            data: [],
            total: await (await this.countLandingPageCollection(args)).total,
        };

        const data = await this.findManyLandingPageCollections(args);
        for (const item of data) {
            const user: BasicWalletInfo = {
                address: item.user_address,
                name: item.user_name,
                description: item.user_description,
                avatar: item.user_avatar,
                discord: item.user_discord,
                facebook: item.user_facebook,
                twitter: item.user_twitter,
                customUrl: item.user_customurl,
            };

            const collection: BasicCollectionInfo = {
                name: item.name,
                description: item.description,
                avatar: item.avatar,
                background: item.background,
                address: item.address,
                type: item.type,
                chainId: item.chain_id ?? 0,
                orgId: item.org_id,
                creator: item.creator,
                paymentToken: item.payment_token,
                totalSupply: item.total_sypply,
                beginTime: item.begin_time,
                endTime: item.end_time,
            };

            const royalty: BasicCollectionRoyaltyInfo = {
                address: item.royalty_address,
                rate: item.royalty_rate,
            };

            const floor: BasicFloorPriceInfo = {
                price: item.floor_price,
                token: item.payment_token,
                chainId: item.chain_id ?? 0,
            };

            const tiers: BasicTierInfo[] = await this.matchCollectionTiers(
                item.address,
                item.chain_id ?? 0,
                item.tiers
            );

            const att = await this.getAttributeOverview(item.id);

            rsp.data.push({
                creator: user,
                collection: collection,
                royalty: royalty,
                floorPrice: floor,
                tiers: tiers,
                attributeOverview: (att ? att.attribute : {}) as JSON,
            });
        }
        return rsp;
    }

    async matchCollectionTiers(collection: string, chainId: number, tiers: string) {
        const tierResult: BasicTierInfo[] = [];
        const tiersArr = Object(tiers) as ITier[];
        const onchainTiers = await this.getTierInfos(collection, chainId, -2);

        for (const tier of tiersArr) {
            const onchainTier = onchainTiers.filter((t) => tier.tierId == t.tier);
            if (!onchainTier || onchainTier.length < 1) continue;

            const attributes: BasicAttributeInfo[] = [];
            if (tier.attributes) {
                for (const a of tier.attributes) {
                    attributes.push({
                        displayType: a.displayType,
                        value: a.value as string,
                        traitType: a.traitType,
                    });
                }
            }
            tierResult.push({
                collection: collection,
                name: tier.name,
                description: tier.description,
                avatar: tier.avatar,
                id: tier.tierId,
                startId: onchainTier[0].start_id,
                endId: onchainTier[0].end_id,
                currentId: onchainTier[0].current_id,
                price: {
                    price: onchainTier[0].price,
                    token: onchainTier[0].payment_token,
                    chainId: onchainTier[0].chain_id ?? 0,
                },
                attributes: attributes,
            });
        }
        return tierResult;
    }

    async findManyLandingPageCollections(args: LandingPageCollectionReqDto) {
        let sqlStr = `
        SELECT
            uw.address AS user_address,uw.name AS user_name,uw.description AS user_description,uw.avatar AS user_avatar,uw."discordLink" AS user_discord,uw."facebookLink" AS user_facebook,uw."twitterLink" AS user_twitter,uw."customUrl" AS user_customurl,
            c.id, c."name",c.description,c.avatar,c.background,c.collection AS address,c."type",c.chain_id AS chain_id,c.org_id,c.creator,pm.payment_token,SUM(pm.end_id - pm.start_id + 1) AS total_sypply,pm.begin_time,pm.end_time,
            pm.royalty_receiver as royalty_address, pm.royalty_rate,
            MIN(pm.price::decimal(30, 0)) floor_price,
            c.tiers
        FROM
            collection AS c
        LEFT JOIN
            pre_mint AS pm
        ON
            c.collection=pm.contract
        LEFT JOIN
            "UserWallet" as uw
        ON
            c.creator=uw.address
        WHERE
            pm.contract IS NOT NULL
        `;

        const values: unknown[] = [];
        if (args.type) {
            sqlStr = `${sqlStr} AND c.type=?`;
            values.push(args.type);
        }

        if (args.chainId) {
            sqlStr = `${sqlStr} AND c.chain_id=?`;
            values.push(args.chainId);
        }

        if (args.status) {
            const currTime = Number(Date.now() / 1000);
            switch (args.status) {
                case BasicCollectionStatus.Upcoming:
                    sqlStr = `${sqlStr} AND pm.begin_time >= ?`;
                    values.push(currTime);
                    break;
                case BasicCollectionStatus.Live:
                    sqlStr = `${sqlStr} AND pm.begin_time <= ? AND ? <= pm.end_time`;
                    values.push(currTime);
                    values.push(currTime);
                    break;
                case BasicCollectionStatus.Expired:
                    sqlStr = `${sqlStr} AND pm.end_time <= ?`;
                    values.push(currTime);
                    break;
            }
        }
        sqlStr +=
            ' GROUP BY c.id,pm.payment_token,pm.id,uw.address,uw."name",uw.description,uw.avatar,uw."discordLink",uw."facebookLink",uw."twitterLink",uw."customUrl"';

        if (args.skip) {
            sqlStr = `${sqlStr} OFFSET ${args.skip}`;
            values.push(args.skip);
        }
        if (args.take) {
            sqlStr = `${sqlStr} LIMIT ${args.take}`;
            values.push(args.take);
        }
        const rsp = await this.pgClient.select<LandingPageCollectionItem>(sqlStr, values);
        return rsp;
    }

    async getTierInfos(address: string, chainId: number, tier: number) {
        let sqlStr = `
            SELECT
                pm.owner,pm.contract,pm.begin_time,pm.end_time,pm.tier,
                pm.start_id,pm.current_id,pm.end_id,pm.payment_token,pm.price,pm.chain_id
            FROM
                pre_mint AS pm
            WHERE
                1=1
            `;

        const values: unknown[] = [];
        sqlStr = `${sqlStr} AND pm.contract=? AND pm.chain_id=?`;
        values.push(address);
        values.push(chainId);

        if (tier != -2) {
            sqlStr = `${sqlStr} AND pm.tier=?`;
            values.push(tier);
        }
        const res = await this.pgClient.select<IPreMint>(sqlStr, values);
        return res;
    }

    async getAttributeOverview(collection: string) {
        try {
            const metaOverviewCol = this.mongoClient.db.collection('metadata_overview');

            const data = (await metaOverviewCol.findOne({ collection: collection })) as unknown as IAttributeOverview;
            return data;
        } catch (err) {
            return {} as IAttributeOverview;
        }
    }

    async countLandingPageCollection(args: LandingPageCollectionReqDto) {
        let sqlStr = `
        SELECT
           COUNT(*) AS total
        FROM
            collection AS c
        LEFT JOIN
            pre_mint AS pm
        ON
            c.collection=pm.contract
        WHERE
            pm.contract IS NOT NULL`;
        const values: unknown[] = [];

        if (args.type) {
            sqlStr = `${sqlStr} AND c.type=?`;
            values.push(args.type);
        }

        if (args.chainId) {
            sqlStr = `${sqlStr} AND c.chain_id=?`;
            values.push(args.chainId);
        }

        if (args.status) {
            const currTime = Number(Date.now() / 1000);
            switch (args.status) {
                case BasicCollectionStatus.Upcoming:
                    sqlStr = `${sqlStr} AND pm.begin_time >= ?`;
                    values.push(currTime);
                    break;
                case BasicCollectionStatus.Live:
                    sqlStr = `${sqlStr} AND pm.begin_time <= ? AND ? <= pm.end_time`;
                    values.push(currTime);
                    values.push(currTime);
                    break;
                case BasicCollectionStatus.Expired:
                    sqlStr = `${sqlStr} AND pm.end_time <= ?`;
                    values.push(currTime);
                    break;
            }
        }
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, values);
        return rsp;
    }

    async getRankingOfCreators(args: LandingPageRankingOfCreatorsReqDto): Promise<LandingPageRankingOfCreatorsRspDto> {
        const rsp: LandingPageRankingOfCreatorsRspDto = {
            data: [],
            total: await (await this.countRankingOfCreator(args)).total,
        };
        const data = await this.findManyRankingOfCreators(args);
        for (const item of data) {
            const user: BasicWalletInfo = {
                address: item.user_address,
                name: item.user_name,
                description: item.user_description,
                avatar: item.user_avatar,
                discord: item.user_discord,
                facebook: item.user_facebook,
                twitter: item.user_twitter,
                customUrl: item.user_customurl,
            };

            const volume: BasicPriceInfo = {
                price: item.total_price,
                token: item.payment_token,
                chainId: item.chain_id,
            };

            rsp.data.push({
                user: user,
                volume: volume,
            });
        }
        return rsp;
    }

    async findManyRankingOfCreators(args: LandingPageRankingOfCreatorsReqDto) {
        let sqlStr = `
        SELECT
            uw.address AS user_address,uw.name AS user_name,uw.description AS user_description,uw.avatar AS user_avatar,uw."discordLink" AS user_discord,uw."facebookLink" AS user_facebook,uw."twitterLink" AS user_twitter,uw."customUrl" AS user_customurl,
            SUM(pm.price::decimal(30, 0)) AS total_price,pmr.payment_token,pmr.chain_id
        FROM
            pre_mint_record AS pmr
        LEFT JOIN
            pre_mint AS pm
        ON
            pmr.contract=pm.contract
        LEFT JOIN
            "UserWallet" AS uw
        ON
            pm."owner"=uw.address
        WHERE
            1=1
        `;

        const values: unknown[] = [];
        if (args.startTime) {
            sqlStr = `${sqlStr} AND pmr.tx_time >= ?`;
            values.push(args.startTime);
        }
        if (args.endTime) {
            sqlStr = `${sqlStr} AND pmr.tx_time <= ?`;
            values.push(args.endTime);
        }
        if (args.chainId) {
            sqlStr = `${sqlStr} AND pmr.chain_id=?`;
            values.push(args.chainId);
        }

        sqlStr +=
            ' GROUP BY uw.address,uw."name",uw.description,uw.avatar,uw."discordLink",uw."facebookLink",uw."twitterLink",uw."customUrl",pmr.payment_token,pmr.chain_id';
        sqlStr += ' ORDER BY total_price DESC';

        if (args.skip) {
            sqlStr = `${sqlStr} OFFSET ${args.skip}`;
            values.push(args.skip);
        }
        if (args.take) {
            sqlStr = `${sqlStr} LIMIT ${args.take}`;
            values.push(args.take);
        }
        const rsp = await this.pgClient.select<LandingPageRankingOfCreatorItem>(sqlStr, values);
        return rsp;
    }

    async countRankingOfCreator(args: LandingPageRankingOfCreatorsReqDto) {
        let sqlStr = `
        SELECT
           COUNT(DISTINCT(uw.id)) AS total
        FROM
           pre_mint_record AS pmr
       LEFT JOIN
           pre_mint AS pm
       ON
           pmr.contract=pm.contract
       LEFT JOIN
           "UserWallet" AS uw
       ON
           pm."owner"=uw.address
       WHERE
           1=1
       `;

        const values: unknown[] = [];
        if (args.startTime) {
            sqlStr = `${sqlStr} AND pmr.tx_time >= ?`;
            values.push(args.startTime);
        }
        if (args.endTime) {
            sqlStr = `${sqlStr} AND pmr.tx_time <= ?`;
            values.push(args.endTime);
        }
        if (args.chainId) {
            sqlStr = `${sqlStr} AND pmr.chain_id=?`;
            values.push(args.chainId);
        }
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, values);
        return rsp;
    }

    async getRankingOfItems(args: LandingPageRankingOfItemsReqDto): Promise<LandingPageRankingOfItemsRspDto> {
        const rsp: LandingPageRankingOfItemsRspDto = {
            data: [],
            total: await (await this.countRankingOfItems(args)).total,
        };

        const data = await this.findManyRankingOfItems(args);
        for (const item of data) {
            const tiersArr = Object(item.tiers) as ITier[];
            const offchainTier = tiersArr.filter((t) => t.tierId == item.tier_id);

            const attributes: BasicAttributeInfo[] = [];
            if (offchainTier.length > 0 && offchainTier[0].attributes) {
                for (const a of offchainTier[0].attributes) {
                    attributes.push({
                        displayType: a.displayType,
                        value: a.value as string,
                        traitType: a.traitType,
                    });
                }
            }

            const tier: BasicTierInfo = {
                collection: item.address,
                name: offchainTier.length > 0 ? offchainTier[0].name : '',
                description: offchainTier.length > 0 ? offchainTier[0].description : '',
                avatar: offchainTier.length > 0 ? offchainTier[0].avatar : '',
                id: item.tier_id,
                startId: item.tier_startid,
                endId: item.tier_endid,
                currentId: item.tier_currentid,
                price: {
                    price: item.tier_price,
                    token: item.payment_token,
                    chainId: item.chain_id,
                },
                attributes: attributes,
            };

            const collection: BasicCollectionInfo = {
                name: item.name,
                description: item.description,
                avatar: item.avatar,
                background: item.background,
                address: item.address,
                type: item.type,
                chainId: item.chain_id,
                orgId: item.org_id,
                creator: item.creator,
                paymentToken: item.payment_token,
                totalSupply: item.total_sypply,
                beginTime: item.begin_time,
                endTime: item.end_time,
            };

            rsp.data.push({
                collection: collection,
                tier: tier,
            });
        }
        return rsp;
    }

    async findManyRankingOfItems(args: LandingPageRankingOfItemsReqDto) {
        let sqlStr = `
        SELECT
            pm.tier AS tier_id,pm.start_id AS tier_startid,pm.end_id AS tier_endid,pm.current_id AS tier_currentid,pm.price AS tier_price,
            c.id, c."name",c.description,c.avatar,c.background,c.collection AS address,c."type",c.chain_id AS chain_id,c.org_id,c.creator,pm.payment_token,SUM(pm.end_id - pm.start_id + 1) AS total_sypply,pm.begin_time,pm.end_time,c.tiers
        FROM
            pre_mint AS pm
        LEFT JOIN
            collection AS c
        ON
            pm.contract=c.collection
        WHERE
            pm.current_id != pm.start_id
        `;

        const values: unknown[] = [];
        if (args.chainId) {
            sqlStr = `${sqlStr} AND c.chain_id=?`;
            values.push(args.chainId);
        }

        sqlStr +=
            ' GROUP BY c.id,pm.payment_token,pm.begin_time,pm.end_time,pm.tier,pm.start_id,pm.end_id,pm.current_id,pm.price';
        sqlStr += ' ORDER BY pm.current_id - pm.start_id DESC';
        if (args.skip) {
            sqlStr = `${sqlStr} OFFSET ${args.skip}`;
            values.push(args.skip);
        }
        if (args.take) {
            sqlStr = `${sqlStr} LIMIT ${args.take}`;
            values.push(args.take);
        }
        const rsp = await this.pgClient.select<LandingPageRankingOfItemItem>(sqlStr, values);
        return rsp;
    }

    async countRankingOfItems(args: LandingPageRankingOfItemsReqDto) {
        let sqlStr = `
        SELECT
           COUNT(DISTINCT(pm.id)) AS total
        FROM
           pre_mint AS pm
       LEFT JOIN
           collection AS c
       ON
           pm.contract=c.collection
        WHERE
           pm.current_id != pm.start_id
       `;

        const values: unknown[] = [];
        if (args) {
            sqlStr = `${sqlStr} AND c.chain_id=?`;
            values.push(args.chainId);
        }
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, values);
        return rsp;
    }
}
