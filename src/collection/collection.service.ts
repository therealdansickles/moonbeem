import { GraphQLError } from 'graphql';
import { isEmpty, isNil, omitBy } from 'lodash';
import { In, IsNull, Repository, UpdateResult } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as Sentry from '@sentry/node';

import { fromCursor, PaginatedImp } from '../lib/pagination/pagination.model';
import { OpenseaService } from '../opensea/opensea.service';
import { SaleHistory } from '../saleHistory/saleHistory.dto';
import { getCurrentPrice } from '../saleHistory/saleHistory.service';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Tier as TierDto } from '../tier/tier.dto';
import { Tier } from '../tier/tier.entity';
import { TierService } from '../tier/tier.service';
import { CollectionHoldersPaginated } from '../wallet/wallet.dto';
import { Wallet } from '../wallet/wallet.entity';
import {
    Collection,
    CollectionActivities,
    CollectionActivityType,
    CollectionPaginated,
    CollectionSold,
    CollectionSoldPaginated,
    CollectionStat,
    CollectionStatus,
    CreateCollectionInput,
    LandingPageCollection,
    SecondarySale,
    UpdateCollectionInput,
    ZeroAccount,
} from './collection.dto';
import * as collectionEntity from './collection.entity';

type ICollectionQuery = Partial<Pick<Collection, 'id' | 'address' | 'name'>>;

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
        private tierService: TierService,
        private openseaService: OpenseaService,
        private coinService: CoinService
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
        const collection = await this.collectionRepository.findOne({
            where: query,
            relations: ['organization', 'creator', 'collaboration'],
        });

        if (collection) {
            collection.tiers = (await this.tierService.getTiersByQuery({
                collection: { id: collection.id },
            })) as Tier[];
        }

        return collection;
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
            relations: ['organization', 'tiers', 'creator', 'collaboration'],
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
            relations: ['organization', 'tiers', 'creator', 'collaboration'],
        });

        for (const collection of collections) {
            const contract = await this.mintSaleContractRepository.findOne({ where: { collectionId: collection.id } });
            const tiers: TierDto[] = [];
            for (const tier of collection.tiers) {
                if (tier.paymentTokenAddress) {
                    const coin = await this.coinService.getCoinByAddress(tier.paymentTokenAddress);
                    tiers.push({
                        ...tier,
                        coin,
                    });
                }
            }
            const collectionInfo: Collection = { ...collection, tiers };
            result.push({
                ...collectionInfo,
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
            relations: ['organization', 'tiers', 'creator', 'collaboration'],
        });
    }

    /**
     * Retrieve the collection stat from secondary markets.
     * @param query The condition of the collection to retrieve.
     */
    async getSecondartMarketStat(query: ICollectionQuery): Promise<CollectionStat[]> {
        query = omitBy(query, isNil);
        if (isEmpty(query)) return null;
        const collection = await this.collectionRepository.findOne({ where: query });
        if (!collection) return null;
        if (!collection.nameOnOpensea || collection.nameOnOpensea == '') {
            throw new GraphQLError('The nameOnOpensea must provide', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
        const statFromOpensea = await this.openseaService.getCollectionStat(collection.nameOnOpensea);
        // may have multiple sources, so make it as array
        return [
            {
                source: 'opensea',
                data: statFromOpensea,
            },
        ];
    }

    /**
     * Creates a new collection with the given data.
     *
     * @param data The data to use when creating the collection.
     * @returns The newly created collection.
     */
    async createCollection(data: any): Promise<Collection> {
        try {
            return this.collectionRepository.save(data);
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
     * @param params The id of the collection to update and the data to update it with.
     * @returns A boolean if it updated succesfully.
     */
    async updateCollection(id: string, data: Partial<Omit<UpdateCollectionInput, 'id'>>): Promise<boolean> {
        try {
            const result: UpdateResult = await this.collectionRepository.update(id, data);
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
                if (!tier.merkleRoot)
                    throw new GraphQLError('Please provide merkleRoot for the whitelisting collection.');
            });
        }

        const dd = collection as Collection;
        const createResult = await this.collectionRepository.save(dd);

        if (tiers) {
            for (const tier of tiers) {
                await this.tierService.createTier({ collection: { id: createResult.id }, ...tier });
            }
        }

        const result = await this.collectionRepository.findOne({
            where: { id: createResult.id },
            relations: ['tiers', 'organization', 'collaboration'],
        });
        return result;
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

        // NOTE: use this when we wanna attach wallet. CURENTLY, we will not have wallet's for every address
        // so this WILL BREAK.
        //return await this.walletRepository.find({ where: { address: In(result.map((r) => r.recipient)) } });
    }

    async getHolders(
        address: string,
        before: string,
        after: string,
        first: number,
        last: number
    ): Promise<CollectionHoldersPaginated> {
        const contract = await this.mintSaleContractRepository.findOneBy({ address });

        const builder = this.asset721Repository
            .createQueryBuilder('asset')
            .leftJoinAndSelect(MintSaleTransaction, 'transaction', 'asset.tokenId = transaction.tokenId')
            .select('asset.owner', 'owner')
            .addSelect('asset.tokenId', 'tokenId')
            .addSelect('COUNT(asset.tokenId)', 'quantity')
            .addSelect('transaction.tierId', 'tierId')
            .addSelect('asset.txTime', 'txTime')
            .where('asset.address = :address AND transaction.tokenAddress = :address', {
                address: contract.tokenAddress,
            })
            .groupBy('asset.owner')
            .addGroupBy('asset.tokenId')
            .addGroupBy('transaction.tierId')
            .addGroupBy('asset.txTime');

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
                .select('COUNT(asset.owner) AS count')
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
                    quantity: holder.quantity ? parseInt(holder.quantity) : 0,
                    tier,
                    createdAt: new Date(createdAt.getTime() + createdAt.getTimezoneOffset() * 60 * 1000), // timestamp to iso time
                };
            })
        );
        return PaginatedImp(data, totalResult ? parseInt(totalResult.count) : 0);
    }

    async getUniqueHolderCount(address: string): Promise<number> {
        const contract = await this.mintSaleContractRepository.findOneBy({ address });

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
                })
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
            })
        );

        return { data, total };
    }

    async getLandingPageCollections(
        status: CollectionStatus,
        offset: number,
        limit: number
    ): Promise<LandingPageCollection> {
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
                    })
                ),
            },
            relations: ['organization', 'tiers', 'creator', 'collaboration'],
        });

        const data = await Promise.all(
            collections.map(async (collection) => {
                collection.tiers = (await this.tierService.getTiersByQuery({
                    collection: { id: collection.id },
                })) as Tier[];
                return { ...collection };
            })
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
     * Get collection earnings by token address
     *
     * @param tokenAddress
     *
     * @returns {bigint} collection earnings in wei
     */
    public async getCollectionEarningsByTokenAddress(tokenAddress: string): Promise<bigint> {
        const earnings = await this.mintSaleTransactionRepository
            .createQueryBuilder('MintSaleTransaction')
            .select('SUM(CAST("MintSaleTransaction"."price" as NUMERIC))', 'sum')
            .where('"MintSaleTransaction"."tokenAddress" = :tokenAddress', { tokenAddress })
            .getRawOne();

        return BigInt(earnings?.sum || 0);
    }

    public async getCollectionSold(
        address: string,
        before: string,
        after: string,
        first: number,
        last: number
    ): Promise<CollectionSoldPaginated> {
        console.log(address);
        if (!address) return PaginatedImp([], 0);

        const builder = this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .where('txn.address = :address', { address });
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
            })
        );

        return PaginatedImp(data, total);
    }
}
