import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import * as MintSaleContractEntity from './mint-sale-contract.entity';
import { MintSaleContract } from './mint-sale-contract.dto';
import { MongoAdapter } from '../../lib/adapters/mongo.adapter';
import { FactoryService } from '../factory/factory.service';
import { MintSaleTransaction } from '../mint-sale-transaction/mint-sale-transaction.entity';

@Injectable()
export class MintSaleContractService {
    constructor(
        @InjectRepository(MintSaleContractEntity.MintSaleContract, 'sync_chain')
        private readonly contractRepository: Repository<MintSaleContractEntity.MintSaleContract>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private readonly transactionRepository: Repository<MintSaleTransaction>,
        private factoreService: FactoryService,
        private readonly mongoRepository: MongoAdapter
    ) {}

    async createMintSaleContract(data: any): Promise<MintSaleContract> {
        return await this.contractRepository.save(data);
    }

    async getMintSaleContract(id: string): Promise<MintSaleContract> {
        return await this.contractRepository.findOneBy({ id });
    }

    async getMintSaleContractByCollection(collectionId: string): Promise<MintSaleContract> {
        const contract = await this.contractRepository.findOneBy({ collectionId });
        if (!contract) {
            return null;
        }

        const factory = await this.factoreService.getFactoryByAddress(contract.address);
        return {
            ...contract,
            kind: factory?.kind,
        };
    }
}
