import * as collectionEntity from '../collection/collection.entity';
import { CollectionKind } from '../collection/collection.entity';
import { Asset721 } from '../sync-chain/asset721/asset721.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Wallet } from '../wallet/wallet.entity';
import { User } from '../user/user.entity';
import { Nft } from '../nft/nft.entity';
import { DataPoint, PlatformData, PlatformStats } from './analytics.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectRepository(collectionEntity.Collection)
        private readonly collectionRepository: Repository<collectionEntity.Collection>,
        @InjectRepository(Asset721, 'sync_chain')
        private readonly asset721Repository: Repository<Asset721>,
        @InjectRepository(Wallet)
        private readonly walletRepository: Repository<Wallet>,
        @InjectRepository(Nft)
        private readonly nftRepository: Repository<Nft>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) {
    }

    async getPlatformData(): Promise<PlatformData> {
        const key = 'analytics::platformData';
        const cacheValue = await this.cacheManager.get(key) as string;
        if (cacheValue) {
            try {
                return JSON.parse(cacheValue);
            } catch (err) {
                console.error('invalid cache data');
            }
        }

        const platformData = {
            mintSaleCollectionsData: await this.getMintSaleCollectionData(30),
            mintedNFTsData: await this.getMintedNFTsData(30),
            totalCreatorsData: await this.getTotalCreatorsData(30),
            totalUsersData: await this.getTotalUsersData(30),
        };
        await this.cacheManager.set(key, JSON.stringify(platformData), 60 * 1000);
        return platformData;
    }

    async getPlatformStats(): Promise<PlatformStats> {
        const key = 'analytics::platformStats';
        const cacheValue = await this.cacheManager.get(key) as string;
        if (cacheValue) {
            try {
                return {
                    totalCounts: JSON.parse(cacheValue)
                };
            } catch (err) {
                console.error('invalid cache data');
            }
        }
        const totalCounts = {
            mintSaleCollectionsCount: await this.getMintSaleCollectionsCount(),
            mintedNFTsCount: await this.getMintedNFTsCount(),
            totalCreatorsCount: await this.getTotalCreatorsCount(),
            totalUsersCount: await this.getTotalUsersCount(),
        };
        await this.cacheManager.set(key, JSON.stringify(totalCounts), 60 * 1000);

        return {
            totalCounts,
        };
    }

    async getMintSaleCollectionsCount(): Promise<number> {
        return this.collectionRepository.count({
            where: {
                kind: Not(CollectionKind.airdrop),
            },
        });
    }

    async getMintedNFTsCount(): Promise<number> {
        return this.nftRepository.count();
    }

    async getTotalCreatorsCount(): Promise<number> {
        return this.userRepository.count();
    }

    async getTotalUsersCount(): Promise<number> {
        return this.walletRepository.count({
            where: {
                owner: {
                    id: IsNull(),
                },
            },
        });
    }

    async getMintSaleCollectionData(days: number): Promise<DataPoint[]> {
        const dataPoints = await this.collectionRepository
            .createQueryBuilder('collection')
            .select(`TO_CHAR("createdAt", 'YYYY-MM-DD') as date_string, count(1), STRING_AGG(id::text, ',') as ids`)
            .where('collection.kind != :kind', { kind: CollectionKind.airdrop })
            .andWhere(`collection.createdAt >= CURRENT_DATE - (:days * INTERVAL '1 day')`, { days })
            .andWhere(`collection.createdAt < CURRENT_DATE`)
            .groupBy('date_string')
            .getRawMany();
        return dataPoints.map((dataPoint) => ({
            date: dataPoint.date_string,
            count: parseInt(dataPoint.count),
        }));
    }

    async getMintedNFTsData(days: number): Promise<DataPoint[]> {
        const dataPoints = await this.nftRepository
            .createQueryBuilder('nft')
            .select(`TO_CHAR("createdAt", 'YYYY-MM-DD') as date_string, count(1), STRING_AGG(id::text, ',') as ids`)
            .andWhere(`nft.createdAt >= CURRENT_DATE - (:days * INTERVAL '1 day')`, { days })
            .andWhere(`nft.createdAt < CURRENT_DATE`)
            .groupBy('date_string')
            .getRawMany();
        return dataPoints.map((dataPoint) => ({
            date: dataPoint.date_string,
            count: parseInt(dataPoint.count),
        }));
    }

    async getTotalCreatorsData(days: number): Promise<DataPoint[]> {
        const dataPoints = await this.userRepository
            .createQueryBuilder('user')
            .select(`TO_CHAR("createdAt", 'YYYY-MM-DD') as date_string, count(1), STRING_AGG(id::text, ',') as ids`)
            .andWhere(`user.createdAt >= CURRENT_DATE - (:days * INTERVAL '1 day')`, { days })
            .andWhere(`user.createdAt < CURRENT_DATE`)
            .groupBy('date_string')
            .getRawMany();
        return dataPoints.map((dataPoint) => ({
            date: dataPoint.date_string,
            count: parseInt(dataPoint.count),
        }));
    }

    async getTotalUsersData(days: number): Promise<DataPoint[]> {
        const dataPoints = await this.walletRepository
            .createQueryBuilder('wallet')
            .select(`TO_CHAR("createdAt", 'YYYY-MM-DD') as date_string, count(1), STRING_AGG(id::text, ',') as ids`)
            .andWhere(`wallet.createdAt >= CURRENT_DATE - (:days * INTERVAL '1 day')`, { days })
            .andWhere(`wallet.createdAt < CURRENT_DATE`)
            .andWhere('wallet.ownerId is null')
            .groupBy('date_string')
            .getRawMany();
        return dataPoints.map((dataPoint) => ({
            date: dataPoint.date_string,
            count: parseInt(dataPoint.count),
        }));
    }
}
