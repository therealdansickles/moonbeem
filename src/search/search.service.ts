import { Injectable } from '@nestjs/common';
import { SearchInput } from './search.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Collection } from '../collection/collection.entity';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { SearchUser } from '../user/user.dto';
import { SearchWallet } from '../wallet/wallet.dto';
import { CollectionOutput, SearchCollection } from '../collection/collection.dto';
import { Wallet } from '../wallet/wallet.entity';
import { Tier } from '../tier/tier.entity';

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        @InjectRepository(Collection) private collectionRepository: Repository<Collection>,
        @InjectRepository(Tier) private tierRepository: Repository<Tier>
    ) {}

    async searchFromUser(input: SearchInput): Promise<SearchUser> {
        const [users, total] = await this.userRepository
            .createQueryBuilder('user')
            .where('LOWER(name) LIKE :keyword OR LOWER(username) LIKE :keyword', {
                keyword: `%${input.keyword.toLowerCase()}%`,
            })
            .skip(input.offset)
            .limit(input.limit)
            .getManyAndCount();

        return { users, total };
    }

    async searchFromWallet(input: SearchInput): Promise<SearchWallet> {
        const [wallets, total] = await this.walletRepository
            .createQueryBuilder('wallet')
            .where('LOWER(address) LIKE :keyword OR LOWER(name) LIKE :keyword', {
                keyword: `%${input.keyword.toLowerCase()}%`,
            })
            .skip(input.offset)
            .limit(input.limit)
            .getManyAndCount();
        return { wallets, total };
    }

    async searchFromCollection(input: SearchInput): Promise<SearchCollection> {
        const [results, total] = await this.collectionRepository
            .createQueryBuilder('collection')
            .where('LOWER(name) LIKE :keyword OR LOWER("displayName") LIKE :keyword OR LOWER(address) LIKE :keyword', {
                keyword: `%${input.keyword.toLowerCase()}%`,
            })
            .skip(input.offset)
            .limit(input.limit)
            .getManyAndCount();

        const collections: CollectionOutput[] = [];
        for (const collection of results) {
            const totalSupply = await this.tierRepository
                .createQueryBuilder('tier')
                .select('SUM(tier.totalMints)', 'totalSupply')
                .where('tier.collectionId = :id', { id: collection.id })
                .addGroupBy('tier.collectionId')
                .getRawOne();

            collections.push({
                id: collection.id,
                name: collection.name,
                slug: collection.slug,
                kind: collection.kind,
                displayName: collection.displayName,
                about: collection.about,
                address: collection.address,
                avatarUrl: collection.avatarUrl,
                backgroundUrl: collection.backgroundUrl,
                nameOnOpensea: collection.nameOnOpensea,
                totalSupply: totalSupply ? parseInt(totalSupply.totalSupply) : 0,
            });
        }
        return { collections, total };
    }
}
