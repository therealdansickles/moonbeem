import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { MintSaleTransaction } from './mint-sale-transaction.entity';
import { LeaderboardRanking } from './mint-sale-transaction.dto';

@Injectable()
export class MintSaleTransactionService {
    constructor(
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private readonly transactionRepository: Repository<MintSaleTransaction>
    ) {}

    async createMintSaleTransaction(data: any): Promise<MintSaleTransaction> {
        return await this.transactionRepository.save(data);
    }

    async getMintSaleTransaction(id: string): Promise<MintSaleTransaction> {
        return await this.transactionRepository.findOneBy({ id });
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
}
