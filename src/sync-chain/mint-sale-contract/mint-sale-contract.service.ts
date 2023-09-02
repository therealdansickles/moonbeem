import { isInteger } from 'lodash';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { FactoryService } from '../factory/factory.service';
import { MintSaleTransaction } from '../mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleContract } from './mint-sale-contract.dto';
import * as MintSaleContractEntity from './mint-sale-contract.entity';

@Injectable()
export class MintSaleContractService {
    constructor(
        @InjectRepository(MintSaleContractEntity.MintSaleContract, 'sync_chain')
        private readonly contractRepository: Repository<MintSaleContractEntity.MintSaleContract>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private readonly transactionRepository: Repository<MintSaleTransaction>,
        private factoreService: FactoryService,
    ) {}

    async createMintSaleContract(data: any): Promise<MintSaleContract> {
        return await this.contractRepository.save(data);
    }

    async getMintSaleContract(id: string): Promise<MintSaleContract> {
        return await this.contractRepository.findOneBy({ id });
    }

    // ?? lagecy issue
    // without `tokenId` it should return array but not one record
    async getMintSaleContractByCollection(collectionId: string, tokenId?: number): Promise<MintSaleContract> {
        const query: any = { collectionId };
        if (isInteger(tokenId)) {
            query.startId = LessThanOrEqual(tokenId);
            query.endId = MoreThanOrEqual(tokenId);
        }
        const contract = await this.contractRepository.findOneBy(query);
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
