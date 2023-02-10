import { Injectable } from '@nestjs/common';
import {
    VActivityReqDto,
    VActivityRspDto,
    VActivityStatus,
    VAddressHoldingRspDto,
    VAddressReleasedRspDto,
    VCollectionActivityRspDto,
    VGlobalSearchReqDto,
    VGlobalSearchRspDto,
    VICollectionType,
    VITierAttr,
    VSearchAccountItem,
    VSearchAccountRsp,
    VSearchCollectionItem,
    VSearchCollectionRsp,
    VSecondaryMarketView,
} from 'src/dto/market.dto';
import { MongoAdapter } from 'src/lib/adapters/mongo.adapter';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { IRowCount } from 'src/lib/modules/db.module';
import { IMetadata } from 'src/lib/modules/db.mongo.module';
import { AddressActivity, AddressHolding, AddressReleased, CollectionActivity, SearchAccountItem, SearchCollectionItem, TotalRecord } from 'src/lib/modules/db.record.module';
import { AuthPayload } from './auth.service';
import { UserWalletService } from './user.wallet.service';

@Injectable()
export class MarketService {
    constructor(private readonly pgClient: PostgresAdapter, private readonly userWallet: UserWalletService, private readonly mongoClient: MongoAdapter) {}

    // services: controller
    async getCollectionActivities(args: VActivityReqDto, payload?: AuthPayload) {
        let rsp: VCollectionActivityRspDto = {
            data: [],
            total: await (await this.countCollectionActivity(args.address.toLowerCase())).total,
        };

        const data = await this.findManyCollectionActivities(args.address.toLowerCase(), args.skip, args.take);

        for (let d of data) {
            let status: VActivityStatus;
            switch (d.owner) {
                case d.recipient:
                    status = VActivityStatus.Mint;
                    break;
                default:
                    status = VActivityStatus.Transfer;
                    break;
            }
            let col: VICollectionType = {
                address: d.collection_address,
                name: d.collection_name,
                avatar: d.collection_avatar,
                description: d.collection_description,
                background: d.collection_background,
                type: d.collection_type,
            };
            const secondary = await this.getSecondaryMarketView();
            let meta = await this.getMetadataFromMongo(d.collection_id, d.collection_tier);

            let attrs = [];
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

    async getAddressReleased(args, payload?: AuthPayload) {
        let rsp: VAddressReleasedRspDto = {
            data: [],
            total: await (await this.countAddressReleased(args.address)).total,
        };

        // check address exists
        const userWallet = await this.userWallet.findOne(args.address.toLowerCase());
        if (!userWallet) throw new Error('address not found');
        const data = await this.findManyAddressReleased(args.address.toLowerCase(), args.skip, args.take);

        for (let d of data) {
            let col: VICollectionType = {
                address: d.collection_address,
                name: d.collection_name,
                avatar: d.collection_avatar,
                description: d.collection_description,
                background: d.collection_background,
                type: d.collection_type,
            };

            const secondary = await this.getSecondaryMarketView();
            let meta = await this.getMetadataFromMongo(d.collection_id, d.collection_tier);

            let attrs = [];
            if (!meta || !meta.attributes) {
                meta = {
                    token: '',
                    token_id: '',
                    name: '',
                    image: '',
                    external_url: '',
                    attributes: [],
                };
            }
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
                name: meta.name ?? '',
                avatar: meta.image ?? '',
                description: meta.description ?? '',
                quantity: d.end_id - d.start_id + 1, // TODO: just erc721 now, so it can be 1
                owner: d.owner,
                tierId: d.collection_tier,
                attributes: attrs as VITierAttr[],
                currentPrice: d.price,
                secondary: secondary,
                extensions: [],
            });
        }
        return rsp;
    }

    async getAddressActivities(args: VActivityReqDto, payload?: AuthPayload) {
        let rsp: VActivityRspDto = {
            data: [],
            total: await (await this.countAddressActivity(args.address.toLowerCase())).total,
        };
        // check address exists
        const userWallet = await this.userWallet.findOne(args.address.toLowerCase());
        if (!userWallet) throw new Error('address not found');

        const data = await this.findManyAddressActivities(args.address.toLowerCase(), args.skip, args.take);

        for (let d of data) {
            let status: VActivityStatus;
            switch (d.owner) {
                case d.recipient:
                    status = VActivityStatus.Mint;
                    break;
                default:
                    status = VActivityStatus.Transfer;
                    break;
            }
            let col: VICollectionType = {
                address: d.collection_address,
                name: d.collection_name,
                avatar: d.collection_avatar,
                description: d.collection_description,
                background: d.collection_background,
                type: d.collection_type,
            };
            const secondary = await this.getSecondaryMarketView();
            let meta = await this.getMetadataFromMongo(d.collection_id, d.collection_tier);

            let attrs = [];
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
            });
        }
        return rsp;
    }

    async getAddressHoldings(args, payload?: AuthPayload) {
        let rsp: VAddressHoldingRspDto = {
            data: [],
            total: await (await this.countAddressHoldings(args.address)).total,
        };

        // check address exists
        const userWallet = await this.userWallet.findOne(args.address.toLowerCase());
        if (!userWallet) throw new Error('address not found');
        const data = await this.findManyAddressHoldings(args.address.toLowerCase(), args.skip, args.take);

        for (let d of data) {
            let col: VICollectionType = {
                address: d.collection_address,
                name: d.collection_name,
                avatar: d.collection_avatar,
                description: d.collection_description,
                background: d.collection_background,
                type: d.collection_type,
            };

            const secondary = await this.getSecondaryMarketView();
            let meta = await this.getMetadataFromMongo(d.collection_id, d.collection_tier);

            let attrs = [];
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
            collection AS c
        LEFT JOIN
            pre_mint AS pm
        ON
            pm.contract=c.collection
        LEFT JOIN
            pre_mint_record AS pmr
        ON
            pm.contract=pmr.contract AND pm.tier=pmr.tier
        LEFT JOIN
            assets_721 AS asset
        ON
            pm.nft_token=asset.token AND pmr.token_id=asset.token_id
        WHERE
            c.collection=?`;

        let values: any[] = [];
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

    async findManyAddressReleased(address: string, offset?: number, limit?: number) {
        let sqlStr = `
        SELECT
            c.id AS collection_id,c.collection AS collection_address,c."name" AS collection_name,c.avatar AS collection_avatar,c.description AS collection_description,c.background AS collection_background,c."type" AS collection_type,pm.tier AS collection_tier,
            pm.contract AS token,pm.owner  AS owner,pm.price  AS price,pm.start_id,pm.end_id
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

        let values: any[] = [];
        values.push(address);

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

    async findManyAddressActivities(address: string, offset?: number, limit?: number) {
        let sqlStr = `
        SELECT
            c.id AS collection_id,c.collection AS collection_address,c."name" AS collection_name,c.avatar AS collection_avatar,c.description AS collection_description,c.background AS collection_background,c."type" AS collection_type,pmr.tier AS collection_tier,
            pmr.contract AS token,pmr.token_id AS token_id,pmr.recipient  AS recipient,pmr.price  AS price,asset.owner
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
            pmr.recipient=?`;

        let values: any[] = [];
        values.push(address);

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

    async findManyAddressHoldings(address: string, offset?: number, limit?: number) {
        let sqlStr = `
        SELECT
            c.id AS collection_id,c.collection AS collection_address,c."name" AS collection_name,c.avatar AS collection_avatar,c.description AS collection_description,c.background AS collection_background,c."type" AS collection_type,pmr.tier AS collection_tier,
            pmr.contract AS token,pmr.token_id AS token_id,pmr.recipient  AS owner,pmr.price  AS price
        FROM
            pre_mint_record AS pmr
        LEFT JOIN
            collection AS c
        ON
            pmr.contract=c.collection
        WHERE
            pmr.recipient=?`;

        let values: any[] = [];
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
        let sqlStr = `
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

    async countAddressReleased(address: string) {
        let sqlStr = `
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

    async countCollectionActivity(address: string) {
        let sqlStr = `
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

    async countAddressActivity(address: string) {
        let sqlStr = `
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

    // services: other
    async getSecondaryMarketView() {
        // TODO: no secondary now
        let view: VSecondaryMarketView = {
            onSale: false,
            onSalePrice: '',
            maxSalePrice: '',
            latestSalePrice: '',
        };
        return view;
    }

    async getMetadataFromMongo(collectionId: string, tierId: number): Promise<IMetadata> {
        const metaCol = this.mongoClient.db.collection('metadata');
        const r = (await metaCol.findOne({ 'vibe_properties.collection': collectionId, 'vibe_properties.tier_id': tierId })) as unknown as IMetadata | null;
        return r;
    }

    async executeSearch(searchArgs: VGlobalSearchReqDto, AuthPayload?: AuthPayload): Promise<VGlobalSearchRspDto> {
        const page = searchArgs.page || 0;
        const pageSize = searchArgs.pageSize || 10;
        const offset = page * pageSize;

        const collectionSqlStr = `select * from collection where lower(name) like '%${searchArgs.searchTerm.toLowerCase()}%' or lower(collection) like '%${searchArgs.searchTerm.toLowerCase()}%' fetch first ${pageSize} row only offset ${offset} rows`;
        const collectionSqlCountStr = `SELECT COUNT(*) FROM collection where lower(name) like '%${searchArgs.searchTerm.toLowerCase()}%' or lower(collection) like '%${searchArgs.searchTerm.toLowerCase()}%'`;

        const collectionCountRsp = await this.pgClient.query<IRowCount>(collectionSqlCountStr);
        const collectionRsp = await this.pgClient.select<SearchCollectionItem>(collectionSqlStr);
        const isLastCollectionPage = collectionCountRsp.count - (offset + collectionRsp.length) <= 0;

        const collectionData: VSearchCollectionItem[] = collectionRsp.map((col) => ({
            name: col.name,
            image: col.avatar,
            collection: col.collection,
            itemsCount: col.tiers.reduce((sum, item) => (sum += item.endId - item.startId + 1), 0),
        }));

        const accountSqlStr = `select * from "UserWallet" where lower(address) like '%${searchArgs.searchTerm.toLowerCase()}%' OR lower(name) like '%${searchArgs.searchTerm.toLowerCase()}%' fetch first ${pageSize} row only offset ${offset} rows`;
        const accountSqlCountStr = `SELECT COUNT(*) FROM "UserWallet" where lower(address) like '%${searchArgs.searchTerm.toLowerCase()}%' or lower(name) like '%${searchArgs.searchTerm.toLowerCase()}%'`;

        const accountCountRsp = await this.pgClient.query<IRowCount>(accountSqlCountStr);
        const accountsRsp = await this.pgClient.select<SearchAccountItem>(accountSqlStr);
        const isLastAccountsPage = accountCountRsp.count - (offset + accountsRsp.length) <= 0;

        const accountsData: VSearchAccountItem[] = accountsRsp.map((acc) => ({
            name: acc.name,
            address: acc.address,
            avatar: acc.avatar,
        }));

        const collections: VSearchCollectionRsp = {
            data: collectionData,
            total: parseInt(collectionCountRsp.count.toString()),
            isLastPage: isLastCollectionPage,
        };

        const accounts: VSearchAccountRsp = {
            data: accountsData,
            total: parseInt(accountCountRsp.count.toString()),
            isLastPage: isLastAccountsPage,
        };

        return {
            collections,
            accounts,
        };
    }
}
