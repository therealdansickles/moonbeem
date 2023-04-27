import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { MintSaleContract } from './mint-sale-contract.entity';

@Injectable()
export class MintSaleContractService {
    constructor(
        @InjectRepository(MintSaleContract, 'sync_chain')
        private readonly contractRepository: Repository<MintSaleContract>
    ) {}

    async createMintSaleContract(data: any): Promise<MintSaleContract> {
        return await this.contractRepository.save(data);
    }

    async getMintSaleContract(id: string): Promise<MintSaleContract> {
        return await this.contractRepository.findOneBy({ id });
    }
}
