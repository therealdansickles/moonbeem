import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { History721 } from './history721.entity';

@Injectable()
export class History721Service {
    constructor(
        @InjectRepository(History721, 'sync_chain') private readonly history721Repository: Repository<History721>
    ) {}

    async createHistory721(data: any): Promise<History721> {
        return await this.history721Repository.save(data);
    }

    async getHistory721(id: string): Promise<History721> {
        return await this.history721Repository.findOneBy({ id });
    }
}
