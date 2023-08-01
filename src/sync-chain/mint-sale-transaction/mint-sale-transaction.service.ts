import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { MintSaleTransaction } from './mint-sale-transaction.entity';
import { BasicTokenPrice, LeaderboardRanking } from './mint-sale-transaction.dto';
import { GraphQLError } from 'graphql';

interface GetTransactionInput {
    id?: string;
    address?: string;
    recipient?: string;
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

    async getLeaderboard(address: string): Promise<LeaderboardRanking[]> {
        const result = await this.transactionRepository
            .createQueryBuilder('tx')
            .select([
                'tx.recipient AS address',
                'SUM(tx.price::numeric(20,0)) AS amount',
                'COUNT(*) AS item',
                'ROW_NUMBER() OVER (ORDER BY SUM(tx.price::numeric(20,0)) DESC) AS rank',
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
    async getEarningsByCollectionAddressesAndBeginTime(
        addresses: string[],
        beginDate: Date
    ): Promise<BasicTokenPrice[]> {
        if (addresses.length == 0) return [];

        const result: BasicTokenPrice[] = await this.transactionRepository
            .createQueryBuilder('txn')
            .select('txn.paymentToken', 'token')
            .addSelect('SUM(txn.price::numeric(20,0))', 'totalPrice')
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
            .select('SUM("txn".price::decimal(30,0))', 'totalPrice')
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
}
