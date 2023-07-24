import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CoinMarketCapService } from '../../coinmarketcap/coinmarketcap.service';
import { Coin } from './coin.entity';
import { CoinQuotes } from './coin.dto';

@Injectable()
export class CoinService {
    constructor(
        @InjectRepository(Coin, 'sync_chain') private readonly coinRepository: Repository<Coin>,
        private coinMarketCapService: CoinMarketCapService
    ) {}

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
            const { chainId: _chainId, ...rest } = data;
            data = rest;
        }

        const coins = await this.coinRepository.find({ where: data });
        return coins;
    }

    async getQuote(symbol: string): Promise<CoinQuotes> {
        return await this.coinMarketCapService.getPrice(symbol);
    }
}
