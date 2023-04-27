import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Asset721 } from './asset721.entity';

@Injectable()
export class Asset721Service {
    constructor(@InjectRepository(Asset721, 'sync_chain') private readonly asset721Repository: Repository<Asset721>) {}

    async createAsset721(data: any): Promise<Asset721> {
        return await this.asset721Repository.save(data);
    }

    async getAsset721(id: string): Promise<Asset721> {
        return await this.asset721Repository.findOneBy({ id });
    }
}
