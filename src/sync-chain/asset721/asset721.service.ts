import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Asset721 } from './asset721.entity';
import { isEmpty } from 'lodash';

@Injectable()
export class Asset721Service {
    constructor(@InjectRepository(Asset721, 'sync_chain') private readonly asset721Repository: Repository<Asset721>) {}

    async createAsset721(data: any): Promise<Asset721> {
        return await this.asset721Repository.save(data);
    }

    async getAsset721(id: string): Promise<Asset721> {
        return await this.asset721Repository.findOneBy({ id });
    }

    async getAsset721ByQuery(query: { tokenId?: string, address?: string }) {
        // empty query always return empty
        if (isEmpty(query)) return null;
        return await this.asset721Repository.findOneBy(query);
    }
}
