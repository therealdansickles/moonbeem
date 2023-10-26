import BigNumber from 'bignumber.js';
import { GraphQLError } from 'graphql';
import { isEmpty, isNil, omitBy } from 'lodash';
import { DeleteResult, Repository, UpdateResult } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { captureException } from '@sentry/node';

import { Collection, CollectionKind } from '../collection/collection.entity';
import { MetadataPropertySearchInput } from '../metadata/metadata.dto';
import { MetadataPropertyClass } from '../metadata/metadata.entity';
import { cursorToStrings, fromCursor, PaginatedImp, stringsToCursor, toPaginated } from '../pagination/pagination.utils';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { TierHoldersPaginated } from '../wallet/wallet.dto';
import { Wallet } from '../wallet/wallet.entity';
import {
    CreateTierInput,
    IAttributeOverview,
    IOverview,
    IPluginOverview,
    IUpgradeOverview,
    Profit,
    Tier,
    TierSearchPaginated,
    UpdateTierInput,
} from './tier.dto';
import * as tierEntity from './tier.entity';
import { renderPropertyName } from './tier.utils';
import { ethers } from 'ethers';

interface ITierSearch {
    collectionId?: string;
    collectionAddress?: string;
    collectionSlug?: string;
    keyword?: string;
    properties?: MetadataPropertySearchInput[];
    plugins?: string[];
    upgrades?: string[];
}

type AttributesOverviewQuery = {
    collectionAddress?: string;
    collectionSlug?: string;
};

export type ITierListQuery = {
    name?: string;
    collection?: { id: string };
    pluginName?: string;
};

export type ITierQuery = { id: string } | { collection: { id: string }; tierId: number };

@Injectable()
export class TierService {
    constructor(
        @InjectRepository(tierEntity.Tier)
        private readonly tierRepository: Repository<tierEntity.Tier>,
        @InjectRepository(Collection)
        private readonly collectionRepository: Repository<Collection>,
        @InjectRepository(Wallet)
        private readonly walletRepository: Repository<Wallet>,
        @InjectRepository(Coin, 'sync_chain')
        private readonly coinRepository: Repository<Coin>,
        @InjectRepository(MintSaleContract, 'sync_chain')
        private readonly contractRepository: Repository<MintSaleContract>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private readonly transactionRepository: Repository<MintSaleTransaction>,
        @InjectRepository(Asset721, 'sync_chain')
        private readonly asset721Repository: Repository<Asset721>,
        private coinService: CoinService,
    ) {}

    /**
     * Get a specific tier by id.
     *
     * @returns The tier.
     * @param query
     */
    async getTier(query: ITierQuery): Promise<Tier> {
        const tier = await this.tierRepository.findOne({ where: query, relations: ['collection'] });
        if (!tier) return null;
        return renderPropertyName(tier);
    }

    /**
     * Get the tiers by query(which support tier name and collection id)
     *
     * @param query The query of the search
     * @returns Array of tiers
     */
    async getTiers(query: ITierListQuery): Promise<Tier[] | null> {
        query = omitBy(query, isNil);
        if (isEmpty(query)) return null;

        const builder = this.tierRepository.createQueryBuilder('tier').leftJoinAndSelect('tier.collection', 'collection');
        if (query.name) builder.andWhere('tier.name = :name', { name: query.name });
        if (query.collection) builder.andWhere('collection.id = :collectionId', { collectionId: query.collection.id });
        if (query.pluginName) builder.andWhere("(tier.metadata->>'uses')::jsonb @> :uses", { uses: JSON.stringify([query.pluginName]) });

        const tiers = await builder.getMany();
        return tiers.map((tier) => renderPropertyName(tier));
    }

    private filterObject(payload: object[]) {
        return payload.map((attribute) => {
            const filteredAttribute = Object.keys(attribute).reduce((accu, key) => {
                if ((attribute[key] !== '' && attribute[key] !== undefined) || attribute[key] !== null) accu[key] = attribute[key];
                return accu;
            }, {});
            return filteredAttribute;
        });
    }

    /**
     * Create a new tier.
     *
     * @param data The data for the new tier.
     * @returns The new tier.
     */
    async createTier(data: CreateTierInput): Promise<Tier> {
        const kind = CollectionKind;

        const collection = await this.collectionRepository.findOneBy({ id: data.collection.id });
        if ([kind.whitelistEdition, kind.whitelistTiered, kind.whitelistBulk].indexOf(collection.kind) >= 0) {
            if (!data.merkleRoot) throw new GraphQLError('Please provide merkleRoot for the whitelisting collection.');
        }

        const dd = data as unknown as tierEntity.Tier;
        dd.collection = data.collection as unknown as Collection;
        // dd.attributes = data.attributes as tierEntity.Attribute[];

        try {
            return await this.tierRepository.save(dd);
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to create tier ${data.name}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Update a tier.
     *
     * @param id The id of the tier.
     * @param data The data to update.
     * @returns True if the tier was updated.
     */
    async updateTier(id: string, data: Omit<UpdateTierInput, 'id'>): Promise<boolean> {
        try {
            const dd = data as unknown as tierEntity.Tier;
            const result: UpdateResult = await this.tierRepository.update(id, dd);
            return result.affected > 0;
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to update tier ${id}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Delete a tier.
     *
     * @param id The id of the tier.
     * @returns True if the tier was deleted.
     */
    async deleteTier(id: string): Promise<boolean> {
        try {
            const result: DeleteResult = await this.tierRepository.delete({ id });
            return result.affected > 0;
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to delete tier ${id}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    async getTierTotalSold(tier: Tier): Promise<number> {
        try {
            const { collection } = tier;
            if (!collection.address) return 0;

            const contract = await this.contractRepository.findOneBy({
                tierId: tier.tierId,
                address: collection.address.toLowerCase(),
            });

            if (!contract) return 0;
            return contract.currentId - contract.startId;
        } catch (error) {
            captureException(error);
            return 0;
        }
    }

    /**
     *
     * @param id The id of the tier
     * @returns Profit object. Contains the price in token and USDC.
     */
    async getTierProfit(id: string): Promise<Profit> {
        try {
            const tier = await this.getTier({ id });
            const { collection } = tier;
            let paymentTokenAddress;
            let inPaymentToken;
            let inPaymentTokenWithDecimals;
            if (!collection.address) return { inPaymentToken: '0', inUSDC: '0' };
            if (collection.kind === CollectionKind.migration) {
                inPaymentToken = new BigNumber(tier.totalMints).multipliedBy(tier.price);
                paymentTokenAddress = tier.paymentTokenAddress;
            } else {
                const result = await this.transactionRepository
                    .createQueryBuilder('transaction')
                    .select('SUM("transaction".price::decimal(30,0))', 'price')
                    .addSelect('transaction.paymentToken', 'token')
                    .where('transaction.address = :address AND transaction.tierId = :tierId', {
                        address: collection.address.toLowerCase(),
                        tierId: tier.tierId,
                    })
                    .groupBy('transaction.paymentToken')
                    .getRawOne();
                if (!result) return { inPaymentToken: '0', inUSDC: '0' };
                paymentTokenAddress = result.token;
                inPaymentTokenWithDecimals = new BigNumber(result.price);
            }
            const coin = await this.coinRepository.findOneBy({ address: paymentTokenAddress });
            const decimals = paymentTokenAddress === ethers.ZeroAddress ? 18 : coin.decimals;
            inPaymentToken = inPaymentToken ?? new BigNumber(inPaymentTokenWithDecimals).div(new BigNumber(10).pow(decimals));

            let paymentTokenPrice;
            if (coin) {
                paymentTokenPrice = coin.derivedUSDC;
            } else {
                const symbol = paymentTokenAddress === ethers.ZeroAddress ? 'ETH' : coin.symbol;
                const quote = await this.coinService.getQuote(symbol);
                paymentTokenPrice = quote['USD'].price;
            }

            /** Example:
             * totalPrice: 10000000
             * decimals: 6(USDC)
             * derivedUSDC: 0.9 (USDC price)
             *
             * const totalUsdcPrice = new BigNumber(totalPrice).div(new BigNumber(10).pow(decimals))
             * totalUsdcPrice = 10000000 / (10 ** 6) => 10000000 / 1000000 = 10 USDC
             *
             * const totalUSDPrice = new BigNumber(totalUsdcPrice).multipliedBy(derivedUSDC);
             * totalUSDPrice = 10 * 0.9 = 9 USD
             */
            const totalUSDC = new BigNumber(inPaymentToken).multipliedBy(paymentTokenPrice);

            return {
                inPaymentToken: inPaymentToken.toString(),
                inUSDC: totalUSDC.toString(),
            };
        } catch (error) {
            captureException(error);
            return { inPaymentToken: '0', inUSDC: '0' };
        }
    }

    async getTotalHolders(id: string): Promise<number> {
        try {
            const tier = await this.tierRepository.findOne({ where: { id: id }, relations: ['collection'] });

            const { count } = await this.asset721Repository
                .createQueryBuilder('asset')
                .leftJoinAndSelect(MintSaleTransaction, 'txn', 'asset.tokenId = txn.tokenId')
                .select('COUNT(DISTINCT(asset.owner))', 'count')
                .where('txn.address = :address AND txn.tierId = :tierId', {
                    address: tier.collection.address,
                    tierId: tier.tierId,
                })
                .andWhere('asset.address = :tokenAddress', { tokenAddress: tier.collection.tokenAddress })
                .getRawOne();

            // The count is a number string due to the javascript number limit
            return parseInt(count, 10);
        } catch (error) {
            captureException(error);
            return 0;
        }
    }

    /**
     * getHolders of a tier.
     * The holders definition is the unique owner of the assets
     * So we should find the assets with unique owner in this tier.
     *
     * @param id tier id
     * @param before The cursor value of an item in the dataset to return before.
     * @param after The cursor value of an item in the dataset to return after.
     * @param first The number of items to return, work with after
     * @param last The number of items to return, work with before
     */
    async getHolders(id: string, before: string, after: string, first: number, last: number): Promise<TierHoldersPaginated> {
        // get tier by tier's id, relate to collection
        const tier = await this.tierRepository.findOne({ where: { id: id }, relations: ['collection'] });
        if (!tier?.collection?.address) {
            return PaginatedImp([], 0);
        }

        const contract = await this.contractRepository.findOneBy({
            address: tier.collection.address,
            tierId: tier.tierId,
        });

        const builder = this.asset721Repository
            .createQueryBuilder('asset')
            .innerJoinAndSelect(MintSaleTransaction, 'txn', 'asset.tokenId = txn.tokenId AND asset.address = txn.tokenAddress')
            .select('txn.tierId', 'tierId')
            .addSelect('asset.owner', 'owner')
            .addSelect('MIN(asset.txTime)', 'txTime')
            .addSelect('COUNT(1) as quantity')
            .where('asset.address = :address', {
                address: contract.tokenAddress,
            })
            .andWhere('txn.tierId = :tierId', { tierId: tier.tierId })
            .groupBy('asset.owner')
            .addGroupBy('txn.tierId');

        if (after) {
            const [quantityString, owner] = cursorToStrings(after);
            const quantity = parseInt(quantityString);
            builder
                .andHaving('COUNT(1) < :quantity', { quantity })
                .orHaving('COUNT(1) = :quantity AND owner < :owner', { quantity, owner })
                .orderBy('quantity', 'DESC')
                .addOrderBy('owner', 'DESC');
            builder.limit(first);
        } else if (before) {
            const [quantityString, owner] = cursorToStrings(before);
            const quantity = parseInt(quantityString);
            builder
                .andHaving('COUNT(1) > :quantity', { quantity })
                .orHaving('COUNT(1) = :quantity AND owner > :owner', { quantity, owner })
                .orderBy('quantity', 'ASC')
                .addOrderBy('owner', 'ASC');
            builder.limit(last);
        } else {
            const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
            builder.orderBy('quantity', 'DESC').addOrderBy('owner', 'DESC').limit(limit);
        }

        const holders = await builder.getRawMany();

        // ignore the transactions and assets until we are clear about the usage
        const data = await Promise.all(
            holders.map(async (holder) => {
                const wallet = await this.walletRepository.findOneBy({ address: holder.owner });
                // Will update his soon when we refactor the pagination
                const createdAt = new Date(holder.txTime * 1000);
                return {
                    ...wallet,
                    address: holder.owner,
                    quantity: holder?.quantity ? parseInt(holder?.quantity) : 0,
                    createdAt: new Date(createdAt.getTime() - createdAt.getTimezoneOffset() * 60 * 1000),
                };
            }),
        );

        const total = await this.getTotalHolders(id);
        return toPaginated(data, total, (entity) => stringsToCursor(entity.quantity.toString(), entity.address));
    }

    async searchTier(query: ITierSearch, before: string, after: string, first: number, last: number): Promise<TierSearchPaginated> {
        if (!query.collectionAddress && !query.collectionId && !query.collectionSlug) return null;
        let builder = this.tierRepository.createQueryBuilder('tier').leftJoinAndSelect('tier.collection', 'collection');

        if (query.collectionAddress) {
            builder = builder.where('collection.address = :collectionAddress', {
                collectionAddress: query.collectionAddress.toLowerCase(),
            });
        } else if (query.collectionId) {
            builder = builder.where('collection.id = :collectionId', { collectionId: query.collectionId });
        } else if (query.collectionSlug) {
            builder = builder.where('collection.slug = :collectionSlug', { collectionSlug: query.collectionSlug });
        }

        if (query.keyword) {
            builder = builder.andWhere('LOWER(tier.name) LIKE :keyword', {
                keyword: `%${query.keyword.toLowerCase()}%`,
            });
        }

        if (query.plugins && query.plugins.length > 0) {
            builder = builder.andWhere("(tier.metadata->>'uses')::jsonb @> :uses", {
                uses: JSON.stringify(query.plugins),
            });
        }

        if (query.properties?.length > 0) {
            const propertyConditions = query.properties.map((property) => {
                const propertyName = property.name;
                const propertyValue = property.value;

                const value = typeof propertyValue === 'string' ? `"${propertyValue}"` : propertyValue;
                return `(tier.metadata->>'properties')::jsonb @> '{"${propertyName}":{"name":"${propertyName}","value":${value}}}'`;
            });

            const conditionString = propertyConditions.join(' OR ');
            builder = builder.andWhere(`(${conditionString})`);
        }

        if (query.upgrades) {
            query.upgrades.forEach((upgrade) => {
                builder = builder.andWhere(
                    `tier.id IN
                    (
                        SELECT t.id
                        FROM (
                            SELECT tier.id, jsonb_array_elements(metadata->'conditions'->'rules')->'update' as rule_info 
                            FROM "Tier" tier
                        ) AS t
                        WHERE t.rule_info @> :upgrade
                    )
                    `,
                    { upgrade: JSON.stringify([{ property: upgrade }]) },
                );
            });
        }

        // pagination
        if (after) {
            builder.where('tier.createdAt > :cursor', { cursor: fromCursor(after) });
            builder.limit(first);
        } else if (before) {
            builder.where('tier.createdAt < :cursor', { cursor: fromCursor(before) });
            builder.limit(last);
        } else {
            const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
            builder.limit(limit);
        }

        builder.orderBy('tier.createdAt', 'ASC');

        const [result, total] = await builder.getManyAndCount();
        const tiers = result.map((tier) => renderPropertyName(tier));
        return PaginatedImp(tiers, total);
    }

    async getAttributesOverview(query: AttributesOverviewQuery): Promise<IOverview> {
        const { collectionAddress, collectionSlug } = query;
        const builder = await this.tierRepository.createQueryBuilder('tier').leftJoinAndSelect('tier.collection', 'collection');
        if (collectionAddress) {
            builder.where('collection.address = :collectionAddress', { collectionAddress });
        } else {
            builder.where('collection.slug = :collectionSlug', { collectionSlug });
        }
        const tiers = await builder.getMany();

        const attributes: IAttributeOverview = {};
        const upgrades: IUpgradeOverview = {};
        const plugins: IPluginOverview = {};

        tiers.forEach((tier) => {
            tier = renderPropertyName(tier);
            if (tier.metadata) {
                if (tier.metadata.properties) {
                    for (const [, value] of Object.entries(tier.metadata.properties)) {
                        if (value.display_value === 'none') continue;
                        if (value.class === MetadataPropertyClass.UPGRADABLE) {
                            upgrades[value.name] ? upgrades[value.name]++ : (upgrades[value.name] = 1);
                        } else {
                            if (!attributes[value.name]) attributes[value.name] = {};
                            attributes[value.name][value.value] ? attributes[value.name][value.value]++ : (attributes[value.name][value.value] = 1);
                        }
                    }
                }

                if (tier.metadata.uses) {
                    tier.metadata.uses.forEach((e) => {
                        plugins[e] ? plugins[e]++ : (plugins[e] = 1);
                    });
                }
            }
        });

        return { attributes: attributes, upgrades: upgrades, plugins: plugins };
    }
}
