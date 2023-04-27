import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { MintSaleTransaction } from './mint-sale-transaction.entity';

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
}
