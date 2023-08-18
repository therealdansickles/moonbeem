import { GraphQLError } from 'graphql';
import { Tier } from 'src/tier/tier.dto';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { BasicTokenPrice, LeaderboardRanking } from './mint-sale-transaction.dto';
import { MintSaleTransaction } from './mint-sale-transaction.entity';

interface GetTransactionInput {
    id?: string;
    address?: string;
    recipient?: string;
}

interface IAggregatedTransactions {
    txHash: string;
    txTime: number;
    tokenIds: Array<string>;
    cost: number;
    recipient: string;
    sender: string;
    paymentToken: string;
    collectionAddress: string;
    tierId: number;
    tier: Tier;
}

@Injectable()
export class MintSaleTransactionService {
    constructor(
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private readonly transactionRepository: Repository<MintSaleTransaction>
    ) {}

    async createMintSaleTransaction(data: any): Promise<MintSaleTransaction> {
        return await this.transactionRepository.save(data);
    }

    async getMintSaleTransaction(input: GetTransactionInput): Promise<MintSaleTransaction> {
        if (!input.id && !input.address && !input.recipient) {
            throw new GraphQLError("Either 'id' or 'address' or 'recipient' have to be provided.", {
                extensions: { code: 'BAD_REQUEST' },
            });
        }
        return await this.transactionRepository.findOneBy(input);
    }

    async getMintSaleTransactions(input: any): Promise<MintSaleTransaction[]> {
        return await this.transactionRepository.findBy(input);
    }

    async getLeaderboard(address: string): Promise<LeaderboardRanking[]> {
        const result = await this.transactionRepository
            .createQueryBuilder('tx')
            .select([
                'tx.recipient AS address',
                'SUM(tx.price::REAL) AS amount',
                'COUNT(*) AS item',
                'ROW_NUMBER() OVER (ORDER BY SUM(tx.price::REAL) DESC) AS rank',
                'tx.paymentToken AS "paymentToken"',
            ])
            .groupBy('tx.recipient')
            .addGroupBy('tx.paymentToken')
            .where('tx.address = :address', { address: address.toLowerCase() })
            .orderBy()
            .getRawMany();

        return result;
    }

    /**
     * get all buyers by matching address lists base on start time
     * @param addresses list of collection addresses
     * @param beginDate start time
     * @returns number of buyers
     */
    async getBuyersByCollectionAddressesAndBeginTime(addresses: string[], beginDate: Date): Promise<number> {
        if (addresses.length == 0) return 0;

        const result = await this.transactionRepository
            .createQueryBuilder('txn')
            .select('COUNT(DISTINCT(txn.recipient))', 'total')
            .where('txn.address IN (:...addresses)', { addresses })
            // txTime is a timestamp that needs to be converted to a date type
            .andWhere('TO_TIMESTAMP(txn.txTime) >= :beginDate', { beginDate })
            .getRawOne();
        return result ? parseInt(result.total ?? 0) : 0;
    }

    /**
     * get all earnings based on address list and start time.
     * @param addresses list of collection addresses
     * @param beginDate start time
     * @returns total earnings list
     */
    async getEarningsByCollectionAddressesAndBeginTime(addresses: string[], beginDate: Date): Promise<BasicTokenPrice[]> {
        if (addresses.length == 0) return [];

        const result: BasicTokenPrice[] = await this.transactionRepository
            .createQueryBuilder('txn')
            .select('txn.paymentToken', 'token')
            .addSelect('SUM(txn.price::REAL)', 'totalPrice')
            .where('txn.address IN (:...addresses)', { addresses })
            .andWhere('TO_TIMESTAMP(txn.txTime) >= :beginDate', { beginDate })
            .addGroupBy('txn.paymentToken')
            .getRawMany();
        return result;
    }

    /**
     * get total sale prices by collection addresses
     *
     * @param addresses list of collection addresses
     * @returns list of token price info
     */
    async getTotalSalesByCollectionAddresses(addresses: string[]): Promise<BasicTokenPrice[]> {
        if (addresses.length == 0) return [];

        const result: BasicTokenPrice[] = await this.transactionRepository
            .createQueryBuilder('txn')
            .select('SUM("txn".price::REAL)', 'totalPrice')
            .addSelect('txn.paymentToken', 'token')
            .where('txn.address IN (:...addresses)', { addresses })
            .groupBy('txn.paymentToken')
            .getRawMany();
        return result;
    }

    /**
     * get total item by collection addresses
     *
     * @param addresses list of collection addresses
     * @returns number of item
     */
    async getTotalItemByCollectionAddresses(addresses: string[]): Promise<number> {
        if (addresses.length == 0) return 0;
        const { total } = await this.transactionRepository
            .createQueryBuilder('txn')
            .select('COUNT(1)', 'total')
            .where('txn.address IN (:...addresses)', { addresses })
            .getRawOne();

        return parseInt(total ?? '0');
    }

    /**
     * get unique recipient by collection addresses
     *
     * @param addresses list of collection addresses
     * @returns number of unique recipient
     */
    async getUniqueRecipientByCollectionAddresses(addresses: string[]): Promise<number> {
        if (addresses.length == 0) return 0;

        const { total } = await this.transactionRepository
            .createQueryBuilder('txn')
            .select('COUNT(DISTINCT(txn.recipient))', 'total')
            .where('txn.address IN (:...addresses)', { addresses })
            .getRawOne();

        return parseInt(total ?? '0');
    }

    /* Get aggregation transactions by address
     * multi NFTs can be minted in one transaction but will stored as multiple records in MintSaleTransaction
     *
     * @param address
     * @param offset
     * @param limit
     */
    async getAggregatedCollectionTransaction(address: string): Promise<Array<IAggregatedTransactions>> {
        const aggregatedTxns = await this.transactionRepository
            .createQueryBuilder('txn')
            .select('min(txn.txHash)', 'txHash')
            .addSelect('array_agg(txn.tokenId order by txn.tokenId)', 'tokenIds')
            .addSelect('sum(txn.price::REAL) as cost')
            .addSelect('min(recipient)', 'recipient')
            .addSelect('min(sender)', 'sender')
            .addSelect('min(txn.txTime)', 'txTime')
            .addSelect('min(txn.paymentToken)', 'paymentToken')
            .addSelect('min(txn.address)', 'collectionAddress')
            .addSelect('min(txn.tierId)', 'tierId')
            .addSelect('min(txn.chainId)', 'chainId')
            .where('txn.address = :address', { address })
            .addGroupBy('txn.txHash')
            .getRawMany();

        return aggregatedTxns;
    }
}
