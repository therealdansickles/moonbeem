import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Coin } from './coin.entity';
import { CoinMarketCapService } from '../../coinmarketcap/coinmarketcap.service';

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
        const coin = await this.coinRepository.findOneBy({ address });
        if (coin) {
            const priceFromCoinMarketCap = await this.coinMarketCapService.getPriceInUSD(coin.symbol);
            if (priceFromCoinMarketCap?.price) {
                coin.derivedUSDC = priceFromCoinMarketCap.price.toString();
            }
            return coin;
        }
        return coin;
    }

    async getCoins(data: any): Promise<Coin[]> {
        if (data.chainId == 0) data.chainId = 1;

        const coins = await this.coinRepository.find({ where: data });

        const result = await Promise.all(
            coins.map(async (c) => {
                const priceFromCoinMarketCap = await this.coinMarketCapService.getPriceInUSD(c.symbol);
                if (priceFromCoinMarketCap?.price) {
                    c.derivedUSDC = priceFromCoinMarketCap.price.toString();
                }
                return c;
            })
        );
        return result;
    }
}
