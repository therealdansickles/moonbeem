import { Injectable } from '@nestjs/common';
import { SearchInput } from './search.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Collection } from '../collection/collection.entity';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';
import { SearchUser } from '../user/user.dto';
import { SearchWallet } from '../wallet/wallet.dto';
import { SearchCollection } from '../collection/collection.dto';
import { Wallet } from '../wallet/wallet.entity';

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        @InjectRepository(Collection) private collectionRepository: Repository<Collection>
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
        const [collections, total] = await this.collectionRepository
            .createQueryBuilder('collection')
            .where('LOWER(name) LIKE :keyword OR LOWER("displayName") LIKE :keyword', {
                keyword: `%${input.keyword.toLowerCase()}%`,
            })
            .skip(input.offset)
            .limit(input.limit)
            .getManyAndCount();
        return { collections, total };
    }
}
