import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { MintSaleTransaction } from './mint-sale-transaction.entity';
import { LeaderboardRanking } from './mint-sale-transaction.dto';
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
}
