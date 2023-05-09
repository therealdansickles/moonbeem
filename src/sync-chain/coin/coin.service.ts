import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
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
        return await this.coinRepository.find({ where: data });
    }
}
