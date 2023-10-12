import BigNumber from 'bignumber.js';
import { startOfDay, startOfMonth, startOfWeek, subDays } from 'date-fns';
import { GraphQLError } from 'graphql';
import { isEmpty, isNil, omitBy, union } from 'lodash';
import { Brackets, DeepPartial, FindOptionsWhere, In, IsNull, Repository, UpdateResult } from 'typeorm';

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';

import { AlchemyService } from '../alchemy/alchemy.service';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { NftService } from '../nft/nft.service';
import { OpenseaService } from '../opensea/opensea.service';
import { AggregatedCollection } from '../organization/organization.dto';
import { cursorToStrings, fromCursor, PaginatedImp, toPaginated } from '../pagination/pagination.utils';
import { SaleHistory } from '../saleHistory/saleHistory.dto';
import { getCurrentPrice } from '../saleHistory/saleHistory.service';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { CoinService } from '../sync-chain/coin/coin.service';
import { History721, History721Type } from '../sync-chain/history721/history721.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { BasicTokenPrice } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.dto';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { Profit, Tier as TierDto } from '../tier/tier.dto';
import { Tier } from '../tier/tier.entity';
import { TierService } from '../tier/tier.service';
import { User } from '../user/user.entity';
import { CollectionHoldersPaginated } from '../wallet/wallet.dto';
import { Wallet } from '../wallet/wallet.entity';
import {
    AggregatedVolume,
    Collection,
    CollectionActivities,
    CollectionActivityType,
    CollectionAggregatedActivityPaginated,
    CollectionEarningsChartPaginated,
    CollectionPaginated,
    CollectionSold,
    CollectionSoldAggregated,
    CollectionSoldPaginated,
    CollectionStat,
    CollectionStatus,
    CreateCollectionInput,
    GrossEarnings,
    LandingPageCollection,
    MetadataOverview,
    MetadataOverviewInput,
    PluginOverview,
    PropertyFilter,
    SearchTokenIdsInput,
    SecondarySale,
    SevenDayVolume,
    UpdateCollectionInput,
    ZeroAccount,
} from './collection.dto';
import * as collectionEntity from './collection.entity';
import { filterTokenIdsByRanges, generateSlug, getCollectionAttributesOverview, getCollectionUpgradesOverview } from './collection.utils';

type ICollectionQuery = Partial<Pick<Collection, 'id' | 'tokenAddress' | 'address' | 'name' | 'slug'>>;

@Injectable()
export class CollectionService {
    constructor(
        @InjectRepository(collectionEntity.Collection)
        private readonly collectionRepository: Repository<collectionEntity.Collection>,
        @InjectRepository(Tier)
        private readonly tierRepository: Repository<Tier>,
        @InjectRepository(Wallet)
        private readonly walletRepository: Repository<Wallet>,
        @InjectRepository(MintSaleContract, 'sync_chain')
        private readonly mintSaleContractRepository: Repository<MintSaleContract>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private readonly mintSaleTransactionRepository: Repository<MintSaleTransaction>,
        @InjectRepository(Asset721, 'sync_chain')
        private readonly asset721Repository: Repository<Asset721>,
        @InjectRepository(History721, 'sync_chain') private readonly history721Repository: Repository<History721>,
        private tierService: TierService,
        private transactionService: MintSaleTransactionService,
        private openseaService: OpenseaService,
        private coinService: CoinService,
        private collectionPluginService: CollectionPluginService,
        private nftService: NftService,
        @Inject(forwardRef(() => AlchemyService))
        private alchemyService: AlchemyService,
    ) {}

    /**
     * Retrieves the collection associated with the given id.
     *
     * @param id The id of the collection to retrieve.
     * @returns The collection associated with the given id.
     */
    async getCollection(id: string): Promise<Collection | null> {
        return await this.collectionRepository.findOne({
            where: { id },
            relations: ['organization', 'tiers', 'creator', 'collaboration'],
        });
    }

    /**
     * Retrieves the collection satisfied the given query.
     *
     * @param query The condition of the collection to retrieve.
     * @returns The collection satisfied the given query.
     */
    async getCollectionByQuery(query: ICollectionQuery): Promise<Collection | null> {
        query = omitBy(query, isNil);
        if (isEmpty(query)) return null;
        return await this.collectionRepository.findOne({
            where: query,
            relations: {
                organization: true,
                creator: true,
                collaboration: true,
                parent: true,
                children: true,
            },
        });
    }

    /**
     * Calculate the count for given query
     *
     * @param query
     * @returns count
     */
    async countCollections(query: FindOptionsWhere<Collection>): Promise<number> {
        return this.collectionRepository.countBy(query);
    }

    /**
     * Retrieves collections related to the given collaboration ID.
     *
     * @param collaborationId The ID of the collaboration to retrieve collections for.
     * @returns The collections related to the given collaboration.
     */
    async getCollectionsByCollaborationId(collaborationId: string): Promise<Collection[]> {
        return await this.collectionRepository.find({
            where: { collaboration: { id: collaborationId } },
            relations: {
                organization: true,
                creator: true,
                collaboration: true,
                parent: true,
                children: true,
            },
        });
    }

    async getCollectionTiers(collectionId: string): Promise<TierDto[] | null> {
        return await this.tierService.getTiers({
            collection: { id: collectionId },
        });
    }

    /**
     * Retrieves the collection associated with the given address.
     *
     * @param address The address of the collection to retrieve.
     * @returns The collection associated with the given address.
     */
    async getCollectionByAddress(address: string): Promise<Collection | null> {
        const collection = await this.collectionRepository.findOne({
            where: { address },
            relations: {
                organization: true,
                creator: true,
                tiers: true,
                collaboration: true,
                parent: true,
                children: true,
            },
        });
        const contract = await this.mintSaleContractRepository.findOne({ where: { collectionId: collection.id } });

        return {
            ...collection,
            contract,
        };
    }

    /**
     * Retrieves the collection associated with the given organization.
     *
     * @param organizationId The id of the organization to retrieve.
     * @returns The collection associated with the given organization.
     */
    async getCollectionsByOrganizationId(organizationId: string): Promise<Collection[]> {
        const result: Collection[] = [];
        const collections = await this.collectionRepository.find({
            where: { organization: { id: organizationId } },
            relations: {
                organization: true,
                creator: true,
                tiers: true,
                collaboration: true,
                parent: true,
                children: true,
            },
        });

        for (const collection of collections) {
            const contract = await this.mintSaleContractRepository.findOne({ where: { collectionId: collection.id } });
            result.push({
                ...collection,
                contract,
            });
        }

        return result;
    }

    /**
     * Retrieves the collection associated with the given wallet.
     *
     * @param walletId The id of the wallet to retrieve.
     * @returns The collection associated with the given wallet.
     */
    async getCreatedCollectionsByWalletId(walletId: string): Promise<Collection[]> {
        return await this.collectionRepository.find({
            where: { creator: { id: walletId } },
            relations: {
                organization: true,
                creator: true,
                tiers: true,
                collaboration: true,
                parent: true,
                children: true,
            },
            order: { createdAt: 'DESC' },
        });
    }

    /**
     * Retrieve the collection stat from secondary markets.
     * @param query The condition of the collection to retrieve.
     */
    async getSecondaryMarketStat(query: ICollectionQuery): Promise<CollectionStat[]> {
        query = omitBy(query, isNil);
        if (isEmpty(query)) return null;
        const collection = await this.collectionRepository.findOne({ where: query });
        if (!collection) return null;
        if (!collection.nameOnOpensea || collection.nameOnOpensea == '') {
            // throw new GraphQLError('The nameOnOpensea must provide', {
            //     extensions: { code: 'INTERNAL_SERVER_ERROR' },
            // });
            console.error('The nameOnOpensea must provide');
            return [
                {
                    source: 'opensea',
                    data: null,
                },
            ];
        }
        const statFromOpensea = await this.openseaService.getCollection(collection.nameOnOpensea);
        // may have multiple sources, so make it as array
        return [
            {
                source: 'opensea',
                data: statFromOpensea,
            },
        ];
    }

    /**
     * Check the data is good for saving as a new collection
     *
     * @param data
     * @returns Whether the given data can be saved as a new collection
     */
    async precheckCollection(data: any): Promise<boolean> {
        if (data.startSaleAt) {
            if (new Date().getTime() / 1000 > data.startSaleAt) {
                throw new Error(`The startSaleAt should be greater than today.`);
            }
            if (data.endSaleAt && data.startSaleAt > data.endSaleAt) {
                throw new Error(`The endSaleAt should be greater than startSaleAt.`);
            }
        }
        const existingCollection = await this.collectionRepository.findOneBy([{ name: data.name }, { slug: generateSlug(data.name) }]);
        if (existingCollection) throw new Error(`The collection name ${data.name} is already taken`);
        return true;
    }

    /**
     * Creates a new collection with the given data.
     *
     * @param data The data to use when creating the collection.
     * @returns The newly created collection.
     */
    async createCollection(data: DeepPartial<collectionEntity.Collection>): Promise<Collection> {
        try {
            const collection = await this.collectionRepository.save({
                slug: generateSlug(data.name),
                ...data,
            });
            return collection;
        } catch (e) {
            Sentry.captureException(e);
            throw new GraphQLError('Failed to create new collection.', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Updates a collection.
     *
     * @param id The id of the collection to update.
     * @param data The data to use when updating the collection.
     * @returns A boolean if it updated successfully.
     */
    async updateCollection(id: string, data: Partial<Omit<UpdateCollectionInput, 'id'>>): Promise<boolean> {
        try {
            const partialCollection = data.name ? { slug: generateSlug(data.name), ...data } : data;
            const result: UpdateResult = await this.collectionRepository.update(id, partialCollection);
            return result.affected > 0;
        } catch (e) {
            Sentry.captureException(e);
            throw new GraphQLError(`Failed to update collection ${id}.`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Publishes a collection.
     *
     * @param id The id of the collection to publish.
     * @returns A boolean if it published successfully.
     */
    async publishCollection(id: string): Promise<boolean> {
        try {
            const result: UpdateResult = await this.collectionRepository.update(id, { publishedAt: new Date() });
            return result.affected > 0;
        } catch (e) {
            Sentry.captureException(e);
            throw new GraphQLError(`Failed to publish collection ${id}.`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * TODO: Fix this and make it a soft deletion.
     *
     * Deletes a collection if it is not published.
     *
     * @param id The id of the collection to delete.
     * @returns true if the collection was deleted, false otherwise.
     */
    async deleteCollection(id: string): Promise<boolean> {
        try {
            // remove the collection tiers first
            await this.tierRepository.delete({ collection: { id } });
            const result = await this.collectionRepository.delete({ id, publishedAt: IsNull() });
            return result.affected > 0;
        } catch (e) {
            Sentry.captureException(e);
            throw new GraphQLError(`Failed to delete collection ${id}.`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    // FIXME: We should clean this up and remove/merge createCollection then.
    /**
     * Creates a new collection with the given tiers.
     *
     * @param data The data to use when creating the collection.
     * @returns The newly created collection.
     */
    async createCollectionWithTiers(data: CreateCollectionInput) {
        const { tiers, ...collection } = data;
        const kind = collectionEntity.CollectionKind;
        if ([kind.whitelistEdition, kind.whitelistTiered, kind.whitelistBulk].indexOf(collection.kind) >= 0) {
            tiers.forEach((tier) => {
                if (!tier.merkleRoot) throw new GraphQLError('Please provide merkleRoot for the whitelisting collection.');
            });
        }

        const createResult = await this.createCollection(collection);

        if (tiers) {
            for (const tier of tiers) {
                await this.tierService.createTier({ collection: { id: createResult.id }, ...tier });
            }
        }

        return await this.collectionRepository.findOne({
            where: { id: createResult.id },
            relations: {
                organization: true,
                tiers: true,
                collaboration: true,
                parent: true,
                children: true,
            },
        });
    }

    /**
     * Get the buyers/wallet of the collection. A buyer is a wallet who has at least one NFT from the collection.
     *
     * @param address The address of the collection.
     */
    async getBuyers(address: string): Promise<string[]> {
        const result = await this.mintSaleTransactionRepository
            .createQueryBuilder('MintSaleTransaction')
            .select('recipient')
            .distinctOn(['"MintSaleTransaction".recipient'])
            .where('address = :address', { address })
            .getRawMany();

        return result.map((r) => r.recipient);

        // NOTE: use this when we wanna attach wallet. CURRENTLY, we will not have wallet's for every address
        // so this WILL BREAK.
        //return await this.walletRepository.find({ where: { address: In(result.map((r) => r.recipient)) } });
    }

    async getHolders(address: string, before: string, after: string, first: number, last: number): Promise<CollectionHoldersPaginated> {
        const contract = await this.mintSaleContractRepository.findOneBy({ address });

        const builder = this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .leftJoinAndSelect(Asset721, 'asset', 'asset.tokenId = txn.tokenId')
            .select('txn.tierId', 'tierId')
            .addSelect('asset.owner', 'owner')
            .addSelect('COUNT(*)', 'quantity')
            .addSelect('MIN(asset.txTime)', 'txTime')
            .addSelect('txn.price', 'price')
            .addSelect('SUM(txn.price::NUMERIC)', 'totalPrice')
            .where('asset.address = :address AND txn.tokenAddress = :address', {
                address: contract.tokenAddress,
            })
            .groupBy('asset.owner')
            .addGroupBy('txn.tierId')
            .addGroupBy('txn.price')
            .orderBy('quantity', 'DESC');
        if (after) {
            builder.andWhere('asset.txTime > :cursor', { cursor: new Date(fromCursor(after)).valueOf() / 1000 });
            builder.limit(first);
        } else if (before) {
            builder.andWhere('asset.txTime < :cursor', { cursor: fromCursor(before) });
            builder.limit(last);
        } else {
            const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
            builder.limit(limit);
        }

        const [holderResults, totalResult] = await Promise.all([
            builder.getRawMany(),
            this.asset721Repository
                .createQueryBuilder('asset')
                .select('COUNT(DISTINCT(asset.owner)) AS count')
                .where('asset.address = :address', { address: contract.tokenAddress })
                .getRawOne(),
        ]);

        const data = await Promise.all(
            holderResults.map(async (holder) => {
                const wallet = await this.walletRepository.findOneBy({ address: holder.owner });

                const tier = await this.tierRepository
                    .createQueryBuilder('tier')
                    .leftJoinAndSelect(collectionEntity.Collection, 'collection', 'tier.collectionId = collection.id')
                    .where('tier.tierId = :tierId', { tierId: holder.tierId })
                    .andWhere('collection.address = :address', { address })
                    .getOne();
                const createdAt = new Date(holder.txTime * 1000);
                return {
                    ...wallet,
                    // the owner can be someone not using our platform
                    address: holder.owner,
                    price: holder.price,
                    totalPrice: holder.totalPrice,
                    quantity: holder.quantity ? parseInt(holder.quantity) : 0,
                    tier,
                    createdAt: new Date(createdAt.getTime() + createdAt.getTimezoneOffset() * 60 * 1000), // timestamp to iso time
                };
            }),
        );
        return PaginatedImp(data, totalResult ? parseInt(totalResult.count) : 0);
    }

    async getUniqueHolderCount(address: string): Promise<number> {
        const contract = await this.mintSaleContractRepository.findOneBy({ address });
        if (!contract) return null;

        const total = await this.asset721Repository
            .createQueryBuilder('asset')
            .select('COUNT(DISTINCT(asset.owner)) AS count')
            .where('asset.address = :address', { address: contract.tokenAddress })
            .getRawOne();

        return total ? parseInt(total.count) : 0;
    }

    async getCollectionActivities(address: string, offset: number, limit: number): Promise<CollectionActivities> {
        const contract = await this.mintSaleContractRepository.findOneBy({ address });

        const [assets, total] = await this.asset721Repository
            .createQueryBuilder('asset')
            .where('asset.address = :address', { address: contract.tokenAddress })
            .offset(offset)
            .limit(limit)
            .getManyAndCount();

        const txns = await this.mintSaleTransactionRepository.findBy({
            tokenAddress: contract.tokenAddress,
            tokenId: In(
                assets.map((asset) => {
                    return asset.tokenId;
                }),
            ),
        });

        const data = await Promise.all(
            assets.map(async (asset) => {
                const txn = txns.find((t) => {
                    return t.tokenAddress == asset.address && t.tokenId == asset.tokenId;
                });

                let type: CollectionActivityType = CollectionActivityType.Transfer;
                if (asset.owner == ZeroAccount) type = CollectionActivityType.Burn;
                if (asset.owner == txn.recipient) type = CollectionActivityType.Mint;

                const tier = await this.tierRepository
                    .createQueryBuilder('tier')
                    .leftJoinAndSelect(collectionEntity.Collection, 'collection', 'tier.collectionId = collection.id')
                    .where('tier.tierId = :tierId', { tierId: txn.tierId })
                    .andWhere('collection.address = :address', { address })
                    .getOne();
                return {
                    ...asset,
                    tier: tier,
                    type: type,
                    transaction: txn,
                };
            }),
        );

        return { data, total };
    }

    async getAggregatedCollectionActivities(
        collectionAddress: string,
        tokenAddress: string,
        before: string,
        after: string,
        first: number,
        last: number,
    ): Promise<CollectionAggregatedActivityPaginated> {
        const builder = await this.history721Repository.createQueryBuilder('history').where('history.address = :address', { address: tokenAddress });
        const countBuilder = builder.clone();
        if (after) {
            const [createdAt, id] = cursorToStrings(after);
            builder.andWhere('history.createdAt > :createdAt', { createdAt });
            builder.orWhere('history.createdAt = :createdAt AND history.id > :id', { createdAt, id });
            builder.orderBy('history.createdAt', 'ASC');
            builder.addOrderBy('history.id', 'ASC');
            builder.limit(first);
        } else if (before) {
            const [createdAt, id] = cursorToStrings(after);
            builder.andWhere('history.createdAt < :createdAt', { createdAt });
            builder.orWhere('history.createdAt = :createdAt AND history.id < :id', { createdAt, id });
            builder.orderBy('history.createdAt', 'DESC');
            builder.addOrderBy('history.id', 'DESC');
            builder.limit(last);
        } else {
            const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
            builder.orderBy('history.createdAt', 'ASC');
            builder.addOrderBy('history.id', 'ASC');
            builder.limit(limit);
        }

        const [histories, count] = await Promise.all([builder.getMany(), countBuilder.getCount()]);
        if (!histories || histories.length == 0) {
            return toPaginated([], 0);
        }

        const tokenIds = histories.map((h) => {
            return h.tokenId;
        });

        const transactions = await this.transactionService.getMintSaleTransactions({
            address: collectionAddress,
            tokenAddress: tokenAddress,
            tokenId: In(tokenIds),
        });

        const tiersMap = await this.getCollectionTiersMap(collectionAddress);
        const res = await Promise.all(
            histories.map(async (history) => {
                const txn = transactions.find((transaction) => {
                    return transaction.tokenId == history.tokenId;
                });
                const tier = tiersMap.get(txn.tierId);

                let cost: Profit = {
                    inPaymentToken: '0',
                    inUSDC: '0',
                };
                if (history.kind == History721Type.mint) {
                    const coin = await this.coinService.getCoinByAddress(txn.paymentToken);
                    const quote = await this.coinService.getQuote(coin.symbol);
                    const totalTokenPrice = new BigNumber(txn.price).div(new BigNumber(10).pow(coin.decimals));
                    const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(quote['USD'].price);

                    cost = {
                        inUSDC: totalUSDC.toString(),
                        inPaymentToken: totalTokenPrice.toString(),
                    };
                }
                return {
                    txHash: history.txHash,
                    txTime: history.txTime,
                    sender: history.sender,
                    recipient: history.receiver,
                    cost: cost,
                    paymentToken: txn.paymentToken,
                    type: this.transactionTypeConversion(history.kind),
                    tokenId: history.tokenId,
                    tier,
                    chainId: history.chainId,
                    id: history.id,
                    createdAt: history.createdAt,
                };
            }),
        );
        return toPaginated(res, count);
    }

    private transactionTypeConversion(t: History721Type): CollectionActivityType {
        switch (t) {
            case History721Type.burn:
                return CollectionActivityType.Burn;
            case History721Type.mint:
                return CollectionActivityType.Mint;
            case History721Type.transfer:
                return CollectionActivityType.Transfer;
            default:
                return CollectionActivityType.Unknown;
        }
    }

    async getLandingPageCollections(status: CollectionStatus, offset: number, limit: number): Promise<LandingPageCollection> {
        const currentTimestamp = Math.round(new Date().valueOf() / 1000);

        let inWhere = '';
        switch (status) {
            case CollectionStatus.active:
                inWhere = `"beginTime" <= ${currentTimestamp} AND "endTime" >= ${currentTimestamp}`;
                break;
            case CollectionStatus.closed:
                inWhere = `"endTime" <= ${currentTimestamp}`;
                break;
            case CollectionStatus.upcoming:
                inWhere = `"beginTime" >= ${currentTimestamp}`;
                break;
            default:
                inWhere = `"beginTime" >= ${currentTimestamp} OR "beginTime" <= ${currentTimestamp} AND "endTime" >= ${currentTimestamp}`;
                break;
        }

        const [contracts, totalResult] = await Promise.all([
            this.mintSaleContractRepository
                .createQueryBuilder('contract')
                .distinctOn(['contract.address'])
                .where(inWhere)
                .offset(offset)
                .limit(limit)
                .getMany(),
            this.mintSaleContractRepository
                .createQueryBuilder('contract')
                .select('COUNT(DISTINCT("contract".address)) AS count')
                .where(inWhere)
                .getRawOne(),
        ]);

        const collections = await this.collectionRepository.find({
            where: {
                address: In(
                    contracts.map((contract) => {
                        return contract.address;
                    }),
                ),
            },
            relations: {
                organization: true,
                creator: true,
                tiers: true,
                collaboration: true,
                parent: true,
                children: true,
            },
        });

        const data = await Promise.all(
            collections.map(async (collection) => {
                collection.tiers = (await this.tierService.getTiers({
                    collection: { id: collection.id },
                })) as Tier[];
                return { ...collection };
            }),
        );

        return {
            total: totalResult ? parseInt(totalResult.count) : 0,
            data: data,
        };
    }

    async getFloorPrice(address: string): Promise<string> {
        const result = await this.mintSaleContractRepository
            .createQueryBuilder('contract')
            .select('MIN(price)')
            .where('address = :address', { address })
            .getRawOne();
        return result.min;
    }

    async getCollections(before: string, after: string, first: number, last: number): Promise<CollectionPaginated> {
        const builder = this.collectionRepository.createQueryBuilder('collection');
        const countBuilder = builder.clone();

        // pagination
        if (after) {
            builder.where('collection.createdAt > :cursor', { cursor: fromCursor(after) });
            builder.limit(first);
        } else if (before) {
            builder.where('collection.createdAt < :cursor', { cursor: fromCursor(before) });
            builder.limit(last);
        } else {
            const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
            builder.limit(limit);
        }

        builder.orderBy('collection.createdAt', 'ASC');

        const [result, total] = await Promise.all([builder.getMany(), countBuilder.getCount()]);
        return PaginatedImp(result, total);
    }

    async getSecondarySale(address: string): Promise<SecondarySale> {
        const params = { asset_contract_address: address, cursor: null };
        let sales: SaleHistory;
        let total = 0;
        const result: SecondarySale = { total: 0 };

        do {
            sales = await this.openseaService.getCollectionEvent(params);
            params.cursor = sales.next;
            // Process data from opensea
            total += this.totalValue(sales);
        } while (sales.next != null);

        result.total = total;
        return result;
    }

    private totalValue(sale: SaleHistory): number {
        return sale.asset_events.reduce((acc, curr) => {
            if (curr.asset.asset_contract.address != curr.transaction.from_account.address) {
                return acc + getCurrentPrice(curr);
            }

            return acc;
        }, 0);
    }

    /**
     * Get collection earnings by collection address
     *
     * @param address The address of the collection
     *
     * @returns The earnings and payment token of the collection
     */
    public async getCollectionEarningsByCollectionAddress(address: string): Promise<BasicTokenPrice> {
        const result: BasicTokenPrice = await this.mintSaleTransactionRepository
            .createQueryBuilder('MintSaleTransaction')
            .select('SUM(CAST("MintSaleTransaction"."price" as NUMERIC))', 'totalPrice')
            .addSelect('MAX("MintSaleTransaction"."paymentToken")', 'token')
            .where('"MintSaleTransaction"."address" = :address', { address })
            .getRawOne();

        // Return null if collection does not have any mint sale transactions
        if (!result.token || !result.totalPrice) {
            return null;
        }

        return result;
    }

    public async getCollectionSold(address: string, before: string, after: string, first: number, last: number): Promise<CollectionSoldPaginated> {
        if (!address) return PaginatedImp([], 0);

        const builder = this.mintSaleTransactionRepository.createQueryBuilder('txn').where('txn.address = :address', { address });
        const countBuilder = builder.clone();

        if (after) {
            builder.andWhere('txn.createdAt > :cursor', { cursor: fromCursor(after) });
            builder.limit(first);
        } else if (before) {
            builder.andWhere('txn.createdAt < :cursor', { cursor: fromCursor(before) });
            builder.limit(last);
        } else {
            const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
            builder.limit(limit);
        }

        const [transactions, total] = await Promise.all([builder.getMany(), countBuilder.getCount()]);
        const data: CollectionSold[] = await Promise.all(
            transactions.map(async (txn) => {
                const tier = await this.tierRepository.findOne({
                    where: {
                        tierId: txn.tierId,
                        collection: {
                            address: address,
                        },
                    },
                });
                return {
                    ...txn,
                    tier: tier,
                };
            }),
        );

        return PaginatedImp(data, total);
    }

    async getOwners(address: string): Promise<number> {
        if (!address) return 0;

        const result = await this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select('COUNT(DISTINCT txn.recipient)', 'total')
            .where('txn.address = :address', { address })
            .getRawOne();

        return parseInt(result.total);
    }

    async getSevenDayVolume(address: string): Promise<SevenDayVolume> {
        if (!address) return { inPaymentToken: '0', inUSDC: '0' };
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const startDate = Math.floor(sevenDaysAgo.getTime() / 1000);
        const endDate = Math.floor(Date.now() / 1000);

        const result = await this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select('txn.paymentToken', 'token')
            .addSelect('SUM(txn.price::NUMERIC)', 'total_price')
            .where('txn.txTime BETWEEN :startDate AND :endDate', { startDate, endDate })
            .andWhere('txn.address = :address', { address })
            .addGroupBy('txn.paymentToken')
            .getRawOne();
        if (result) {
            const coin = await this.coinService.getCoinByAddress(result.token);
            const quote = await this.coinService.getQuote(coin.symbol);
            const usdPrice = quote['USD'].price;

            const tokenPrice = new BigNumber(result.total_price).div(new BigNumber(10).pow(coin.decimals));
            const volume = new BigNumber(tokenPrice).multipliedBy(usdPrice);
            return {
                inPaymentToken: tokenPrice.toString(),
                inUSDC: volume.toString(),
                paymentToken: coin.address,
            };
        }
        return { inPaymentToken: '0', inUSDC: '0' };
    }

    private async getTotalPrice(address: string, between?: number[]): Promise<GrossEarnings> {
        const builder = this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select('txn.paymentToken', 'token')
            .addSelect('SUM(txn.price::NUMERIC)', 'total_price')
            .andWhere('txn.address = :address', { address });

        if (between && between.length == 2) {
            builder.andWhere('txn.txTime BETWEEN :startDate AND :endDate', {
                startDate: between[0],
                endDate: between[1],
            });
        }

        builder.groupBy('txn.paymentToken');
        const result = await builder.getRawOne();
        if (result) {
            const coin = await this.coinService.getCoinByAddress(result.token);
            const quote = await this.coinService.getQuote(coin.symbol);
            const usdPrice = quote['USD'].price;

            const tokenPrice = new BigNumber(result.total_price).div(new BigNumber(10).pow(coin.decimals));
            const volume = new BigNumber(tokenPrice).multipliedBy(usdPrice);

            return {
                inPaymentToken: tokenPrice.toString(),
                inUSDC: volume.toString(),
                paymentToken: coin.address,
            };
        }
        return { inPaymentToken: '0', inUSDC: '0' };
    }

    async getGrossEarnings(address: string): Promise<GrossEarnings> {
        if (!address) return { inPaymentToken: '0', inUSDC: '0' };

        return await this.getTotalPrice(address);
    }

    /**
     * get the number of collections created by the given organization in the month.
     * @param id organization id
     * @returns number of collections
     */
    public async getAggregatedCollectionsByOrganizationId(id: string): Promise<AggregatedCollection> {
        const [monthly, weekly, daily, last30Days, last7Days] = await Promise.all([
            this.getCollectionsByOrganizationIdAndBeginTime(id, startOfMonth(new Date())),
            this.getCollectionsByOrganizationIdAndBeginTime(id, startOfWeek(new Date())),
            this.getCollectionsByOrganizationIdAndBeginTime(id, startOfDay(new Date())),
            this.getCollectionsByOrganizationIdAndBeginTime(id, subDays(new Date(), 30)),
            this.getCollectionsByOrganizationIdAndBeginTime(id, subDays(new Date(), 7)),
        ]);
        return { monthly, weekly, daily, last30Days, last7Days };
    }

    /**
     * get the number of all created collections by wallet address.
     * @param walletAddress wallet address
     * @returns number of collections
     */
    async getCreatedCollectionsByWalletAddress(walletAddress: string): Promise<Collection[]> {
        return await this.collectionRepository
            .createQueryBuilder('collection')
            .leftJoinAndSelect('collection.creator', 'wallet')
            .where('wallet.address = :address', { address: walletAddress })
            .andWhere('collection.address IS NOT NULL')
            .getMany();
    }

    /**
     * get all collections created by all user-bound wallets
     * @param userId user id
     * @returns number of collections
     */
    async getCollectionsByUserId(userId: string): Promise<Collection[]> {
        return await this.collectionRepository
            .createQueryBuilder('collection')
            .leftJoinAndSelect(Wallet, 'wallet', 'collection.creatorId = wallet.id')
            .leftJoinAndSelect(User, 'user', 'wallet.ownerId = user.id')
            .where('user.id = :id', { id: userId })
            .getMany();
    }

    /**
     * Derive the number of all collections created from the start time to the present, based on the organization and the start time
     * @param id organization id
     * @param beginDate start time
     * @returns
     */
    async getCollectionsByOrganizationIdAndBeginTime(id: string, beginDate: Date): Promise<number> {
        return await this.collectionRepository
            .createQueryBuilder('collection')
            .where('collection.organizationId = :id', { id })
            .andWhere('collection.createdAt >= :beginDate', { beginDate })
            .getCount();
    }

    /**
     * Get daily earnings data based on collecton address
     *
     * @param address collection address
     * @param before before cursor
     * @param after after cursor
     * @param first first limit
     * @param last limit
     * @returns CollectionEarningsChartPaginated object
     */
    async getCollectionEarningsChart(
        address: string,
        before: string,
        after: string,
        first: number,
        last: number,
    ): Promise<CollectionEarningsChartPaginated> {
        if (!address) return toPaginated([], 0);

        const builder = this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select(`EXTRACT(EPOCH FROM DATE(TO_TIMESTAMP("txTime")))`, 'time')
            .addSelect('SUM(txn.price::NUMERIC)', 'totalPrice')
            .addSelect('txn.paymentToken', 'paymentToken')
            .where('txn.address = :address', { address })
            .groupBy('time')
            .addGroupBy('txn.paymentToken')
            .orderBy('time', 'DESC');
        if (after) {
            const [_createdAt, id] = cursorToStrings(after);
            builder.andWhere(`DATE_TRUNC('day', TO_TIMESTAMP(txn."txTime")) * 1000 > :cursorTime`, { id });
            builder.limit(first);
        } else if (before) {
            const [_createdAt, id] = cursorToStrings(after);
            builder.andWhere(`DATE_TRUNC('day', TO_TIMESTAMP(txn."txTime")) * 1000 < :cursorTime`, { id });
            builder.limit(last);
        } else {
            const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
            builder.limit(limit);
        }

        const subquery = this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select(`EXTRACT(EPOCH FROM DATE(TO_TIMESTAMP("txTime")))`, 'time')
            .addSelect('SUM(txn.price::NUMERIC)', 'totalPrice')
            .addSelect('txn.paymentToken', 'paymentToken')
            .where('txn.address = :address', { address })
            .groupBy('time')
            .addGroupBy('txn.paymentToken');

        const [result, totalResult] = await Promise.all([
            builder.getRawMany(),
            this.mintSaleTransactionRepository.manager.query(
                `SELECT COUNT(1) AS "total"
                 FROM (${subquery.getSql()}) AS subquery`,
                [address],
            ),
        ]);

        const data = await Promise.all(
            result.map(async (item) => {
                const coin = await this.coinService.getCoinByAddress(item.paymentToken);
                const quote = await this.coinService.getQuote(coin.symbol);
                const totalTokenPrice = new BigNumber(item.totalPrice).div(new BigNumber(10).pow(coin.decimals));
                const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(quote['USD'].price);
                return {
                    id: item.time.toString(),
                    createdAt: new Date(item.time * 1000),
                    time: item.time,
                    volume: {
                        paymentToken: item.paymentToken,
                        inUSDC: totalUSDC.toString(),
                        inPaymentToken: totalTokenPrice.toString(),
                    },
                };
            }),
        );

        const total = totalResult.length > 0 ? parseInt(totalResult[0].total ?? 0) : 0;
        return PaginatedImp(data, total);
    }

    /**
     * get aggregated volumes
     * @param address collection address
     * @returns volume. include total/monthly/weekly
     */
    async getAggregatedVolumes(address: string): Promise<AggregatedVolume> {
        if (!address) return;

        const [total, monthly, weekly] = await Promise.all([
            this.getVolumeByTime(address),
            this.getVolumeByTime(address, startOfMonth(new Date())),
            this.getVolumeByTime(address, startOfWeek(new Date())),
        ]);

        return { total, monthly, weekly };
    }

    async getVolumeByTime(address: string, beginDate?: Date): Promise<Profit> {
        if (!address) return { inPaymentToken: '0', inUSDC: '0' };

        const builder = await this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select('txn.paymentToken', 'token')
            .addSelect('SUM(txn.price::NUMERIC)', 'total_price')
            .where('txn.address = :address', { address })
            .addGroupBy('txn.paymentToken');

        if (beginDate) {
            builder.andWhere('TO_TIMESTAMP(txn.txTime) >= :beginDate', { beginDate });
        }

        const result = await builder.getRawOne();
        if (result) {
            const coin = await this.coinService.getCoinByAddress(result.token);
            const quote = await this.coinService.getQuote(coin.symbol);
            const usdPrice = quote['USD'].price;

            const tokenPrice = new BigNumber(result.total_price).div(new BigNumber(10).pow(coin.decimals));
            const volume = new BigNumber(tokenPrice).multipliedBy(usdPrice);
            return {
                inPaymentToken: tokenPrice.toString(),
                inUSDC: volume.toString(),
            };
        }
        return { inPaymentToken: '0', inUSDC: '0' };
    }

    /**
     * get collection sold items aggregated by transaction hash
     * @param address collection address
     * @returns collection sold items aggregated by transaction hash
     * */
    public async getAggregatedCollectionSold(address: string, tokenAddress: string): Promise<CollectionSoldAggregated> {
        const assets = await this.asset721Repository
            .createQueryBuilder('asset')
            .where('asset.address = :address', { address: tokenAddress })
            .getMany();

        if (!assets || assets.length === 0) {
            return { total: 0, data: [] };
        }

        const transactions = await this.transactionService.getAggregatedCollectionTransaction(address);

        if (!transactions || transactions.length === 0) {
            return { total: 0, data: [] };
        }

        const paymentToken = await this.coinService.getCoinByAddress(transactions[0].paymentToken);
        const quote = await this.coinService.getQuote(paymentToken.symbol);

        if (!paymentToken) {
            throw new Error(`Failed to get token ${transactions[0].paymentToken}`);
        }

        const tiersMap = await this.getCollectionTiersMap(address);

        // Prepare promises for all the processing and fetch operations
        const promises = transactions.map(async (txn) => {
            const tokenId = txn.tokenIds[0];
            const asset = assets.find((asset) => asset.tokenId === tokenId);

            // Only need mint transactions where the owner is the recipient
            if (asset && asset.owner === txn.recipient) {
                const tier = tiersMap.get(txn.tierId);

                const totalTokenPrice = new BigNumber(txn.cost).div(new BigNumber(10).pow(paymentToken.decimals));
                const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(quote['USD'].price);

                return {
                    ...txn,
                    tier,
                    cost: {
                        inUSDC: totalUSDC.toString(),
                        inPaymentToken: totalTokenPrice.toString(),
                    },
                };
            }
        });

        // Execute all promises in parallel
        const result = await Promise.all(promises);

        // Filter out undefined values and sort by txTime desc
        const filteredResult = result.filter(Boolean).sort((a, b) => b.txTime - a.txTime);

        return { total: filteredResult.length, data: filteredResult };
    }

    /**
     * get transaction cost in human readable format given the payment token decimals
     * @param txn transaction
     * @returns cost in human readable format
     * */
    private getFormattedCost(cost: number, decimals?: number): string {
        const tokenDecimals = decimals || 18;
        const base = BigInt(10);
        const result = (BigInt(cost) / base ** BigInt(tokenDecimals)).toString();
        return result;
    }

    /**
     * helper method to get collection tiers and store as a map
     * @param address collection address
     * @returns collection tiers map
     * */
    private async getCollectionTiersMap(address: string): Promise<Map<number, Tier>> {
        const result = new Map<number, Tier>();

        const collectionTiers = await this.tierRepository.find({
            where: {
                collection: { address },
            },
        });

        if (!collectionTiers || collectionTiers.length === 0) {
            throw new Error(`No tiers found for collection ${address}`);
        }

        for (const tier of collectionTiers) {
            result.set(tier.tierId, tier);
        }

        return result;
    }

    async searchTokenIds(input: SearchTokenIdsInput): Promise<string[]> {
        const { staticPropertyFilters, dynamicPropertyFilters, collectionId } = input;
        const collection = await this.collectionRepository.findOneBy({ id: collectionId });
        if (!collection) {
            throw new Error(`Collection not found`);
        }
        const ranges = await this.getTokenIdRangesByStaticPropertiesFilters(collectionId, collection.address, staticPropertyFilters);
        const mintedTokenIds = await this.nftService.getNftsIdsByProperties(collectionId, []);
        const mintedTokenIdsInRanges = filterTokenIdsByRanges(mintedTokenIds, ranges);
        const tokenIdsWithDynamicProperties = await this.nftService.getNftsIdsByProperties(collectionId, dynamicPropertyFilters);
        return union(tokenIdsWithDynamicProperties, mintedTokenIdsInRanges);
    }

    async getTokenIdRangesByStaticPropertiesFilters(
        collectionId: string,
        collectionAddress: string,
        propertyFilters: PropertyFilter[],
    ): Promise<number[][]> {
        const contracts = await this.mintSaleContractRepository.findBy({
            address: collectionAddress,
        });

        const builder = this.tierRepository
            .createQueryBuilder('tier')
            .select('tier.tierId', 'tier_id')
            .where('tier.collectionId = :collectionId', { collectionId })
            .orderBy('tier.tierId', 'ASC');
        const filterConditions = propertyFilters.map((propertyFilter) => {
            const { name, value, range } = propertyFilter;
            if (value) {
                return `metadata->'properties'->'${name}'->>'value'='${value}'`;
            }
            if (range) {
                const [min, max] = range;
                return `(metadata->'properties'->'${name}'->>'value')::INTEGER>=${min} AND (metadata->'properties'->'${name}'->>'value')::INTEGER<=${max}`;
            }
            return '';
        });
        const effectiveFilterConditions = filterConditions.filter((condition) => condition !== '');
        if (effectiveFilterConditions.length > 0) {
            builder.andWhere(
                new Brackets((qb) => {
                    effectiveFilterConditions.map((condition) => qb.orWhere(condition));
                }),
            );
        }
        const tiers = await builder.getRawMany();
        return tiers
            .map((tier) => {
                const { tier_id } = tier;
                const contract = contracts.find((contract) => contract.tierId === tier_id);
                if (!contract) {
                    return [];
                }
                const { startId, endId } = contract;
                return [startId, endId];
            })
            .filter((range) => range.length > 0);
    }

    async getMetadataOverview({ collectionId, collectionAddress, collectionSlug }: MetadataOverviewInput): Promise<MetadataOverview> {
        const builder = await this.tierRepository.createQueryBuilder('tier').leftJoinAndSelect('tier.collection', 'collection');
        if (collectionId) {
            builder.where('collection.id = :collectionId', { collectionId });
        } else if (collectionAddress) {
            builder.where('collection.address = :collectionAddress', { collectionAddress });
        } else if (collectionSlug) {
            builder.where('collection.slug = :collectionSlug', { collectionSlug });
        } else {
            throw new Error('Invalid input');
        }
        const tiers = await builder.getMany();
        if (tiers.length === 0) {
            throw new Error('Collection not found');
        }
        collectionId = tiers[0].collection.id;
        const tierTokenCountsMap: Record<number, number> = {};
        const contracts = await this.mintSaleContractRepository.findBy({ collectionId });
        contracts.map((contract) => {
            const { tierId, startId, endId } = contract;
            tierTokenCountsMap[tierId] = endId - startId + 1;
        });
        const totalSupply = Object.values(tierTokenCountsMap).reduce((acc, curr) => acc + curr, 0);

        const attributes = getCollectionAttributesOverview(tiers, tierTokenCountsMap);
        const dynamicAttributes = attributes.dynamicAttributes;
        const enrichedDynamicAttributes = [];
        for (const dynamicAttribute of dynamicAttributes) {
            const { name, type } = dynamicAttribute;
            if (type === 'number') {
                const { min, max } = await this.nftService.getOverviewByCollectionAndProperty({
                    collection: {
                        id: collectionId,
                    },
                    propertyName: name,
                });
                enrichedDynamicAttributes.push({
                    min,
                    max,
                    ...dynamicAttribute,
                });
            } else {
                enrichedDynamicAttributes.push(dynamicAttribute);
            }
        }
        const upgrades = getCollectionUpgradesOverview(tiers, tierTokenCountsMap);
        const plugins = await this.getPluginsOverview(collectionId, totalSupply);

        return {
            attributes: {
                staticAttributes: attributes.staticAttributes,
                dynamicAttributes: enrichedDynamicAttributes,
            },
            upgrades,
            plugins,
        };
    }

    async getPluginsOverview(collectionId: string, totalSupply: number): Promise<PluginOverview[]> {
        const collectionPlugins = await this.collectionPluginService.getCollectionPluginsByCollectionId(collectionId);
        const plugins = [];
        for (const collectionPlugin of collectionPlugins) {
            const count = await this.collectionPluginService.getAppliedTokensCount(collectionPlugin, totalSupply);
            plugins.push({
                name: collectionPlugin.name,
                pluginName: collectionPlugin.plugin.name,
                count,
            });
        }

        return plugins;
    }
}
