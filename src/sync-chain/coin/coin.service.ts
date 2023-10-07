import { Repository } from 'typeorm';

import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Cache } from 'cache-manager';
import { CoinMarketCapService } from '../../coinmarketcap/coinmarketcap.service';
import { Coin } from './coin.entity';
import { CoinQuotes } from './coin.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class CoinService {
    constructor(
        @InjectRepository(Coin, 'sync_chain') private readonly coinRepository: Repository<Coin>,
        private coinMarketCapService: CoinMarketCapService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {}

    async createCoin(data: any): Promise<Coin> {
        return await this.coinRepository.save(data);
    }

    async getCoin(id: string): Promise<Coin> {
        return await this.coinRepository.findOneBy({ id });
    }

    async getCoinByAddress(address: string): Promise<Coin> {
        const cacheKey = `coin::${address}`;
        const cacheData = (await this.cacheManager.get(cacheKey)) as string;
        if (cacheData) {
            try {
                return JSON.parse(cacheData);
            } catch (err) {
                throw new Error('invalid cache data');
            }
        }
        const coin = await this.coinRepository.findOneBy({ address });
        await this.cacheManager.set(cacheKey, JSON.stringify(coin), 60 * 1000);
        return coin;
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
