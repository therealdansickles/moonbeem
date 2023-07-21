import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { CoinMarketCapService } from '../../coinmarketcap/coinmarketcap.service';
import { Coin } from './coin.dto';
import * as coinEntity from './coin.entity';

@Injectable()
export class CoinService {
    constructor(
        @InjectRepository(coinEntity.Coin, 'sync_chain') private readonly coinRepository: Repository<coinEntity.Coin>,
        private coinMarketCapService: CoinMarketCapService
    ) {}

    async createCoin(data: any): Promise<Coin> {
        return await this.coinRepository.save(data);
    }

    async getCoin(id: string): Promise<Coin> {
        const coin = await this.coinRepository.findOneBy({ id });
        const coinData: Coin = coin as any as Coin;

        if (coinData) {
            const price = await this.coinMarketCapService.getPrice(coin.symbol);
            return { ...coinData, quote: price };
        }
        return coinData;
    }

    async getCoinByAddress(address: string): Promise<Coin> {
        const coin = await this.coinRepository.findOneBy({ address });
        const coinData: Coin = coin as any as Coin;

        if (coinData) {
            const price = await this.coinMarketCapService.getPrice(coin.symbol);
            return { ...coinData, quote: price };
        }
        return coinData;
    }

    async getCoins(data: any): Promise<Coin[]> {
        if (data.chainId === 0) {
            const { chainId: _chainId, ...rest } = data;
            data = rest;
        }

        const coins = await this.coinRepository.find({ where: data });

        const result = await Promise.all(
            coins.map(async (c) => {
                const coinData: Coin = c as any as Coin;
                if (coinData) {
                    const price = await this.coinMarketCapService.getPrice(c.symbol);
                    return { ...coinData, quote: price };
                }
                return coinData;
            })
        );
        return result;
    }
}
