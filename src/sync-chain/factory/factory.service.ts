import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Factory } from './factory.entity';

@Injectable()
export class FactoryService {
    constructor(@InjectRepository(Factory, 'sync_chain') private readonly factoryRepository: Repository<Factory>) {}

    async createFactory(data: any): Promise<Factory> {
        return await this.factoryRepository.save(data);
    }

    async getFactory(id: string): Promise<Factory> {
        return await this.factoryRepository.findOneBy({ id });
    }

    async getFactories(chainId: number): Promise<Factory[]> {
        return await this.factoryRepository.find({ where: { chainId: chainId } });
    }

    async getFactoryByAddress(address: string): Promise<Factory> {
        return await this.factoryRepository.findOne({ where: { address } });
    }
}
