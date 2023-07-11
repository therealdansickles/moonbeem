import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Coin } from './coin.entity';

@Injectable()
export class CoinService {
    constructor(@InjectRepository(Coin, 'sync_chain') private readonly coinRepository: Repository<Coin>) {}

    async createCoin(data: any): Promise<Coin> {
        return await this.coinRepository.save(data);
    }

    async getCoin(id: string): Promise<Coin> {
        return await this.coinRepository.findOneBy({ id });
    }

    async getCoinByAddress(address: string): Promise<Coin> {
        return await this.coinRepository.findOneBy({ address });
    }

    async getCoins(data: any): Promise<Coin[]> {
        if (data.chainId === 0) {
            const { enable } = data;
            return await this.coinRepository.find({ where: { enable } });
        }
        return await this.coinRepository.find({ where: data });
    }
}
