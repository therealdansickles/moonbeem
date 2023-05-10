import { Injectable } from '@nestjs/common';
import {
    BasicAttributeInfo,
    BasicCollectionInfo,
    BasicErc721Info,
    BasicPriceInfo,
    BasicTierInfo,
} from '../dto/basic.dto';
import {
    MarketAddressActivitiesReqDto,
    MarketAddressActivitiesRspDto,
    MarketAddressReleasedRspDto,
    MarketAddressReleasedReqDto,
    VCollectionActivityRspDto,
    MarketAddressActivityStatus,
    VICollectionType,
    VCoin,
    VITierAttr,
    VAddressHoldingRspDto,
    VSecondaryMarketView,
} from '../dto/market.dto';
import { MongoAdapter } from '../lib/adapters/mongo.adapter';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter';
import { IPreMint, ITier } from '../lib/interfaces/main.interface';
import { IRowCount } from '../lib/modules/db.module';
import { IMetadata } from '../lib/modules/db.mongo.module';
import {
    CollectionActivity,
    AddressReleased,
    AddressActivity,
    AddressHolding,
    TotalRecord,
    SearchCollectionItem,
    SearchAccountItem,
} from '../lib/modules/db.record.module';
import { UserWalletService } from './user.wallet.service';

@Injectable()
export class MarketService {
    constructor(
        private readonly pgClient: PostgresAdapter,
        private readonly userWallet: UserWalletService,
        private readonly mongoClient: MongoAdapter
    ) {}

    // services: controller
    async getCollectionActivities(args: MarketAddressActivitiesReqDto) {
        const rsp: VCollectionActivityRspDto = {
            data: [],
            total: await (await this.countCollectionActivity(args.address.toLowerCase())).total,
        };

        const data = await this.findManyCollectionActivities(args.address.toLowerCase(), args.skip, args.take);
        for (const d of data) {
            let status: MarketAddressActivityStatus;
            switch (d.owner) {
                case d.recipient:
                    status = MarketAddressActivityStatus.Mint;
                    break;
                default:
                    status = MarketAddressActivityStatus.Transfer;
                    break;
            }
            const col: VICollectionType = {
                address: d.collection_address,
                name: d.collection_name,
                avatar: d.collection_avatar,
                description: d.collection_description,
                background: d.collection_background,
                type: d.collection_type,
            };
            const secondary = await this.getSecondaryMarketView();
            const meta = await this.getMetadataFromMongo(d.collection_id, d.collection_tier);
            const attrs = [];
            meta.attributes.forEach((attr) => {
                attrs.push({
                    extra: '',
                    traitType: attr.trait_type,
                    value: attr.value,
                });
            });

            rsp.data.push({
                token: d.token,
                tokenId: d.token_id,
                status: status,
                collection: col,
                owner: d.recipient,
                recipient: d.owner ?? '',
                name: meta.name,
                avatar: meta.image,
                description: meta.description,
                attributes: attrs,
                secondary: secondary,
                currentPrice: d.price,
                txTime: d.tx_time,
            });
        }
        return rsp;
    }

    // getAddressActivities -> done
    async getAddressActivities(args: MarketAddressActivitiesReqDto) {
        const chainId = args.chainId ?? 0;

        const rsp: MarketAddressActivitiesRspDto = {
            data: [],
            total: await (await this.countAddressActivity(args.address.toLowerCase(), chainId)).total,
        };
        // check address exists
        const userWallet = await this.userWallet.findOne(args.address.toLowerCase());
        if (!userWallet) throw new Error('address not found');

        const data = await this.findManyAddressActivities(args.address.toLowerCase(), chainId, args.skip, args.take);

        for (const item of data) {
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

            const nft: BasicErc721Info = {
                token: item.token,
                tokenId: item.token_id,
                owner: item.owner,
            };

            const tier: BasicTierInfo = await this.matchCollectionTier(
                item.address,
                item.chain_id ?? 0,
                item.tier_id,
                item.tiers
            );

            const secondary: VSecondaryMarketView = await this.getSecondaryMarketView();

            const currentPrice: BasicPriceInfo = {
                price: item.price,
                token: item.payment_token,
                chainId: item.chain_id ?? 0,
            };

            rsp.data.push({
                collection: collection,
                nft: nft,
                tier: tier,
                secondary: secondary,
                currentPrice: currentPrice,
                recipient: item.owner,
                status: MarketAddressActivityStatus.Mint,
            });
        }
        return rsp;
    }

    async countAddressActivity(address: string, chainId: number) {
        const sqlStr = `
        SELECT
            COUNT(*) AS total
        FROM
            pre_mint_record AS pmr
        LEFT JOIN
            collection AS c
        ON
            pmr.contract=c.collection
        WHERE
            pmr.recipient=?
        AND
            c.chain_id=?
        `;

        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [address, chainId]);
        return rsp;
    }

    async findManyAddressActivities(address: string, chainId: number, offset?: number, limit?: number) {
        let sqlStr = `
        SELECT
            c.id, c."name",c.description,c.avatar,c.background,c.collection AS address,c."type",c.chain_id AS chain_id,c.org_id,c.creator,pm.payment_token,SUM(pm.end_id - pm.start_id + 1) AS total_sypply,pm.begin_time,pm.end_time,c.tiers,
            pmr.contract AS token,pmr.token_id,pmr.recipient  AS owner,pmr.price,pmr.tier AS tier_id
        FROM
            pre_mint_record AS pmr
        LEFT JOIN
            collection AS c
        ON
            pmr.contract=c.collection
        LEFT JOIN
            pre_mint AS pm
        ON
            pm.contract=pmr.contract AND pm.tier=pmr.tier
        LEFT JOIN
            assets_721 AS asset
        ON
            pm.nft_token=asset.token AND pmr.token_id=asset.token_id
        WHERE
            pmr.recipient=?
        AND
            c.chain_id=?
        `;

        const values: unknown[] = [];
        values.push(address);
        values.push(chainId);

        sqlStr +=
            ' GROUP BY c.id,pm.payment_token,pm.begin_time,pm.end_time,pmr.contract,pmr.token_id,pmr.recipient,pmr.price,pmr.tier';

        if (offset) {
            sqlStr = `${sqlStr} OFFSET ${offset}`;
            values.push(offset);
        }
        if (limit) {
            sqlStr = `${sqlStr} LIMIT ${limit}`;
            values.push(limit);
        }
        const rsp = await this.pgClient.select<AddressActivity>(sqlStr, values);
        return rsp;
    }

    async matchCollectionTier(collection: string, chainId: number, tierId: number, tiers: string) {
        const tiersArr = Object(tiers) as ITier[];
        const onchainTiers = await this.getTierInfos(collection, chainId, tierId);

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
            return {
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
            };
        }
        return null;
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

    async getSecondaryMarketView() {
        // TODO: no secondary now
        const view: VSecondaryMarketView = {
            onSale: false,
            onSalePrice: '',
            maxSalePrice: '',
            latestSalePrice: '',
        };
        return view;
    }

    // getAddressReleased
    async getAddressReleased(args: MarketAddressReleasedReqDto) {
        const rsp: MarketAddressReleasedRspDto = {
            data: [],
            total: await (await this.countAddressReleased(args.address)).total,
        };

        // // check address exists
        const userWallet = await this.userWallet.findOne(args.address.toLowerCase());
        if (!userWallet) throw new Error('address not found');
        const data = await this.findManyAddressReleased(args.address.toLowerCase(), args.skip, args.take);

        for (const item of data) {
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

            const tier: BasicTierInfo = await this.matchCollectionTier(
                item.address,
                item.chain_id ?? 0,
                item.tier_id,
                item.tiers
            );

            const currentPrice: BasicPriceInfo = {
                price: item.price,
                token: item.payment_token,
                chainId: item.chain_id ?? 0,
            };

            const secondary: VSecondaryMarketView = await this.getSecondaryMarketView();

            rsp.data.push({
                collection: collection,
                tier: tier,
                quantity: 1,
                currentPrice: currentPrice,
                secondary: secondary,
            });
        }
        return rsp;
    }

    async countAddressReleased(address: string) {
        const sqlStr = `
        SELECT
            COUNT(*) AS total
        FROM
            pre_mint AS pm
        LEFT JOIN
            collection AS c
        ON
            pm.contract=c.collection
        WHERE
            pm.owner=?
        AND
            c.id IS NOT NULL`;

        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [address]);
        return rsp;
    }

    async findManyAddressReleased(address: string, offset?: number, limit?: number) {
        let sqlStr = `
        SELECT
            c.id, c."name",c.description,c.avatar,c.background,c.collection AS address,c."type",c.chain_id AS chain_id,c.org_id,c.creator,pm.payment_token,SUM(pm.end_id - pm.start_id + 1) AS total_sypply,pm.begin_time,pm.end_time,c.tiers,
            pm.price,pm.tier AS tier_id
        FROM
            pre_mint AS pm
        LEFT JOIN
            collection AS c
        ON
            pm.contract=c.collection
        WHERE
            pm.owner=?
        AND
            c.id IS NOT NULL`;

        const values: unknown[] = [];
        values.push(address);
        sqlStr += ' GROUP BY c.id,pm.payment_token,pm.begin_time,pm.end_time,pm.price,pm.tier';

        if (offset) {
            sqlStr = `${sqlStr} OFFSET ${offset}`;
            values.push(offset);
        }
        if (limit) {
            sqlStr = `${sqlStr} LIMIT ${limit}`;
            values.push(limit);
        }
        const rsp = await this.pgClient.select<AddressReleased>(sqlStr, values);
        return rsp;
    }

    // ----
    async getAddressHoldings(args) {
        const rsp: VAddressHoldingRspDto = {
            data: [],
            total: await (await this.countAddressHoldings(args.address)).total,
        };

        // check address exists
        const userWallet = await this.userWallet.findOne(args.address.toLowerCase());
        if (!userWallet) throw new Error('address not found');
        const data = await this.findManyAddressHoldings(args.address.toLowerCase(), args.skip, args.take);

        for (const d of data) {
            const col: VICollectionType = {
                address: d.collection_address,
                name: d.collection_name,
                avatar: d.collection_avatar,
                description: d.collection_description,
                background: d.collection_background,
                type: d.collection_type,
            };

            const coin: VCoin = {
                id: d.coin_id,
                chainId: d.coin_chain_id,
                contract: d.coin_contract,
                name: d.coin_name,
                symbol: d.coin_symbol,
                decimals: d.coin_decimals,
                derivedETH: d.coin_derived_eth,
                derivedUSDC: d.coin_derived_usdc,
                native: d.coin_native,
            };

            const secondary = await this.getSecondaryMarketView();
            const meta = await this.getMetadataFromMongo(d.collection_id, d.collection_tier);

            const attrs = [];
            meta.attributes.forEach((attr) => {
                attrs.push({
                    extra: '',
                    traitType: attr.trait_type,
                    value: attr.value,
                });
            });

            rsp.data.push({
                collection: col,
                token: d.token,
                tokenId: d.token_id,
                name: meta.name,
                avatar: meta.image,
                description: meta.description,
                quantity: 1, // TODO: just erc721 now, so it can be 1
                owner: d.owner,
                tierId: d.collection_tier,
                attributes: attrs as VITierAttr[],
                currentPrice: d.price,
                secondary: secondary,
                extensions: [],
                priceInfo: coin,
            });
        }
        return rsp;
    }

    // services: get data
    async findManyCollectionActivities(address: string, offset?: number, limit?: number) {
        let sqlStr = `
        SELECT
            c.id AS collection_id,c.collection AS collection_address,c."name" AS collection_name,c.avatar AS collection_avatar,c.description AS collection_description,c.background AS collection_background,c."type" AS collection_type,pmr.tier AS collection_tier,
            pmr.contract AS token,pmr.token_id AS token_id,pmr.recipient  AS recipient,pmr.price  AS price,asset.owner,pmr.tx_time AS tx_time
        FROM
            pre_mint_record AS pmr
        LEFT JOIN
            pre_mint AS pm
        ON
            pm.contract=pmr.contract AND pm.tier=pmr.tier
        LEFT JOIN
            collection AS c
        ON
            pm.contract=c.collection
        LEFT JOIN
            assets_721 AS asset
        ON
            pm.nft_token=asset.token AND pmr.token_id=asset.token_id
        WHERE
            c.collection=?`;

        const values: unknown[] = [];
        values.push(address);

        if (offset) {
            sqlStr = `${sqlStr} OFFSET ${offset}`;
            values.push(offset);
        }
        if (limit) {
            sqlStr = `${sqlStr} LIMIT ${limit}`;
            values.push(limit);
        }
        const rsp = await this.pgClient.select<CollectionActivity>(sqlStr, values);
        return rsp;
    }

    async findManyAddressHoldings(address: string, offset?: number, limit?: number) {
        let sqlStr = `
        SELECT
        c.id AS collection_id,c.collection AS collection_address,c."name" AS collection_name,c.avatar AS collection_avatar,c.description AS collection_description,c.background AS collection_background,c."type" AS collection_type,pmr.tier AS collection_tier,
        pmr.contract AS token,pmr.token_id AS token_id,pmr.recipient  AS owner,pmr.price  AS price,  co.id as coin_id, co."chainId" as coin_chain_id, co.contract as coin_contract, co.name as coin_name, co.symbol as coin_symbol, co.decimals as coin_decimals, 
        co."derivedETH" as coin_derived_eth,  co."derivedUSDC" as coin_derived_usdc, co.native as coin_native
        FROM
            pre_mint_record AS pmr
        LEFT JOIN
            collection AS c
        ON
            pmr.contract=c.collection
        LEFT JOIN
            coin as co
        ON
            pmr.payment_token = co.contract
        WHERE
            pmr.recipient=?`;

        const values: unknown[] = [];
        values.push(address);

        if (offset) {
            sqlStr = `${sqlStr} OFFSET ${offset}`;
            values.push(offset);
        }
        if (limit) {
            sqlStr = `${sqlStr} LIMIT ${limit}`;
            values.push(limit);
        }
        const rsp = await this.pgClient.select<AddressHolding>(sqlStr, values);
        return rsp;
    }

    // services: count data
    async countAddressHoldings(address: string) {
        const sqlStr = `
        SELECT
            COUNT(*) AS total
        FROM
            pre_mint_record AS pmr
        LEFT JOIN
            collection AS c
        ON
            pmr.contract=c.collection
        WHERE
            pmr.recipient=?`;

        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [address]);
        return rsp;
    }

    async countCollectionActivity(address: string) {
        const sqlStr = `
        SELECT
            COUNT(*) AS total
        FROM
            collection AS c
        LEFT JOIN
            pre_mint_record AS pmr
        ON
            pmr.contract=c.collection
        WHERE
            c.collection=?`;

        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, [address]);
        return rsp;
    }

    // services: other

    async getMetadataFromMongo(collectionId: string, tierId: number): Promise<IMetadata> {
        const metaCol = this.mongoClient.db.collection('metadata');
        const r = (await metaCol.findOne({
            'vibe_properties.collection': collectionId,
            'vibe_properties.tier_id': tierId,
        })) as unknown as IMetadata | null;
        return r;
    }
}
