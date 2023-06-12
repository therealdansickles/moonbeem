import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, UpdateResult, In } from 'typeorm';
import { Coin } from '../sync-chain/coin/coin.entity';
import { Collection, CollectionKind } from '../collection/collection.entity';
import * as tierEntity from './tier.entity';
import { BasicPriceInfo, CreateTierInput, UpdateTierInput, Tier, Profit } from './tier.dto';
import { GraphQLError } from 'graphql';
import { captureException } from '@sentry/node';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import BigNumber from 'bignumber.js';
import { TierHolderData, TierHolders } from '../wallet/wallet.dto';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { Wallet } from '../wallet/wallet.entity';

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
        private readonly asset721Repository: Repository<Asset721>
    ) {}

    /**
     * Get a specific tier by id.
     *
     * @param id The id of the tier.
     * @returns The tier.
     */
    async getTier(id: string): Promise<Tier> {
        const tier = await this.tierRepository.findOne({ where: { id }, relations: ['collection'] });
        const coin = await this.coinRepository.findOne({ where: { address: tier.paymentTokenAddress.toLowerCase() } });

        return {
            ...tier,
            coin,
        };
    }

    /**
     * Get the tiers belonging to a specific collection
     *
     * @param collectionId The id of the collection
     * @returns Array of tiers
     */
    async getTiersByCollection(collectionId: string): Promise<Tier[]> {
        const result: Tier[] = [];
        const tiers = await this.tierRepository.find({
            where: { collection: { id: collectionId } },
            relations: { collection: true },
        });

        for (const tier of tiers) {
            const coin = await this.coinRepository.findOne({
                where: { address: tier.paymentTokenAddress.toLowerCase() },
            });
            result.push({
                ...tier,
                coin,
            });
        }
        return result;
    }

    private filterObject(payload: object[]) {
        return payload.map((attribute) => {
            const filteredAttribute = Object.keys(attribute).reduce((accu, key) => {
                if ((attribute[key] !== '' && attribute[key] !== undefined) || attribute[key] !== null)
                    accu[key] = attribute[key];
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

    async getTierTotalSold(id: string): Promise<number> {
        try {
            const tier = await this.getTier(id);
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
            const tier = await this.getTier(id);
            const { collection } = tier;
            if (!collection.address) return { inPaymentToken: '0', inUSDC: '0' };

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

            const data = result as BasicPriceInfo;
            const coin = await this.coinRepository.findOneBy({ address: data.token.toLowerCase() });

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
            const totalTokenPrice = new BigNumber(data.price).div(new BigNumber(10).pow(coin.decimals));
            const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(coin.derivedUSDC);

            return {
                inPaymentToken: totalTokenPrice.toString(),
                inUSDC: totalUSDC.toString(),
            };
        } catch (error) {
            captureException(error);
            return { inPaymentToken: '0', inUSDC: '0' };
        }
    }

    async getHolders(id: string, offset: number, limit: number): Promise<TierHolders> {
        // get tier by tier's id, relate to collection
        const tier = await this.tierRepository.findOne({ where: { id: id }, relations: ['collection'] });

        // get contract info from sync_chain
        const contract = await this.contractRepository.findOneBy({
            address: tier.collection.address,
            tierId: tier.tierId,
        });

        const [txns, total] = await this.transactionRepository
            .createQueryBuilder('txn')
            .where('txn.address = :address AND txn.tierId = :tierId', {
                address: tier.collection.address,
                tierId: tier.tierId,
            })
            .offset(offset)
            .limit(limit)
            .getManyAndCount();

        const assets = await this.asset721Repository.findBy({
            address: contract.tokenAddress,
            tokenId: In(
                txns.map((txn) => {
                    return txn.tokenId;
                })
            ),
        });

        const wallets = await this.walletRepository.findBy({
            address: In(
                assets.map((asset) => {
                    return asset.owner;
                })
            ),
        });

        const data: TierHolderData[] = txns.map((txn) => {
            const asset = assets.find((a) => {
                return a.tokenId == txn.tokenId && a.address == txn.tokenAddress;
            });
            const wallet = wallets.find((w) => {
                return w.address == asset.owner;
            });
            return {
                ...wallet,
                transaction: txn,
            };
        });

        return { total: total, data: data };
    }
}
