import { Injectable } from '@nestjs/common';
import { VAddressHoldingRspDto, VICollectionType, VITierAttr, VSecondaryMarketView } from 'src/dto/market.dto';
import { MongoAdapter } from 'src/lib/adapters/mongo.adapter';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { IMetadata } from 'src/lib/modules/db.mongo.module';
import { AddressHolding, TotalRecord } from 'src/lib/modules/db.record.module';
import { AuthPayload } from './auth.service';
import { UserWalletService } from './user.wallet.service';

@Injectable()
export class MarketService {
    constructor(private readonly pgClient: PostgresAdapter, private readonly userWallet: UserWalletService, private readonly mongoClient: MongoAdapter) {}

    // async getAddressHoldings(address: string, payload?: AuthPayload) {
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
}
