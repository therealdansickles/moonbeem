import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { CoinModule } from './coin.module';
import { CoinService } from './coin.service';

describe('CoinService', () => {
    let service: CoinService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                CoinModule,
            ],
        }).compile();

        service = module.get<CoinService>(CoinService);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('coin', () => {
        it('should get an coin', async () => {
            const coin = await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
            });

            const result = await service.getCoin(coin.id);
            expect(result.id).toEqual(coin.id);
        });

        it('should get an coin by address', async () => {
            const coin = await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
            });

            const result = await service.getCoinByAddress(coin.address);
            expect(result.id).toEqual(coin.id);
        });

        it('should get coin list for chainId', async () => {
            await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
            });

            const data = { chainId: 1 };
            const result = await service.getCoins(data);
            expect(result.length).toBeGreaterThanOrEqual(2);
        });

        it('should get the entire coin list', async () => {
            await service.createCoin({
                address: faker.finance.ethereumAddress(),
                name: 'Tether USD',
                symbol: 'USDT',
                decimals: 6,
                derivedETH: faker.random.numeric(5),
                derivedUSDC: faker.random.numeric(5),
                chainId: 1,
            });

            const data = { chainId: 0 };
            const result = await service.getCoins(data);
            expect(result.length).toBeGreaterThanOrEqual(2);
        });
    });
});
