import { Injectable } from '@nestjs/common';
import { Royalty } from './royalty.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RoyaltyService {
    constructor(@InjectRepository(Royalty, 'sync_chain') private royaltyRepository: Repository<Royalty>) {}

    async createRoyalty(data: any): Promise<Royalty> {
        return await this.royaltyRepository.save(data);
    }

    async getRoyalty(id: string): Promise<Royalty> {
        return await this.royaltyRepository.findOneBy({ id });
    }
}
