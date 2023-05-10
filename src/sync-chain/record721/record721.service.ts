import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Record721 } from './record721.entity';

@Injectable()
export class Record721Service {
    constructor(
        @InjectRepository(Record721, 'sync_chain') private readonly record721Repository: Repository<Record721>
    ) {}

    async createRecord721(data: any): Promise<Record721> {
        return await this.record721Repository.save(data);
    }

    async getRecord721(id: string): Promise<Record721> {
        return await this.record721Repository.findOneBy({ id });
    }
}
