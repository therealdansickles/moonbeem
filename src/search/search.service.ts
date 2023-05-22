import { Injectable } from '@nestjs/common';
import {
    GloablSearchInput,
    GlobalSearchResult,
    UserSearchResult,
    UserSearchResults,
    CollectionSearchResult,
    CollectionSearchResults,
} from './search.dto';
import { IRowCount } from '../lib/modules/db.module';
import { SearchAccountItem, SearchCollectionItem } from '../lib/modules/db.record.module';
import { InjectRepository } from '@nestjs/typeorm';
import { Collection } from '../collection/collection.entity';
import { ILike, IsNull, Not, Repository } from 'typeorm';
import { User } from '../user/user.entity';

@Injectable()
export class SearchService {
    constructor(
        @InjectRepository(Collection) private collectionRepository: Repository<Collection>,
        @InjectRepository(User) private userRepository: Repository<User>
    ) {}

    async executeGlobalSearchV1(input: GloablSearchInput): Promise<GlobalSearchResult> {
        const page = input.page || 0;
        const pageSize = input.pageSize || 10;
        const offset = page * pageSize;
        const searchTerm = input.searchTerm.toLowerCase();

        const [collectionsResult, totalCollections] = await this.collectionRepository
            .createQueryBuilder('collection')
            .where('LOWER(name) LIKE :query OR LOWER(address) LIKE :query', {
                query: `%${searchTerm}%`,
            })
            .andWhere('address is not null') // this is to prevent showing un-published / draft collections.
            .skip(offset)
            .take(pageSize)
            .getManyAndCount();

        const isLastCollectionPage = totalCollections - (offset + collectionsResult.length) <= 0;
        const collectionData: CollectionSearchResult[] = collectionsResult.map((col) => ({
            name: col.name,
            image: col.avatarUrl,
            address: col.address,
            chainId: col.chainId,
            itemsCount: col.tiers?.reduce((sum, item) => (sum += item.totalMints), 0) || 0,
        }));

        const [usersResult, totalUsers] = await this.userRepository
            .createQueryBuilder('user')
            .innerJoinAndSelect('user.wallets', 'wallet')
            .where('LOWER(wallet.address) LIKE :query OR LOWER(user.name) LIKE :query', { query: `%${searchTerm}%` })
            .skip(offset)
            .take(pageSize)
            .getManyAndCount();

        const isLastAccountsPage = totalUsers - (offset + usersResult.length) <= 0;

        const accountsData: UserSearchResult[] = usersResult.map((acc) => ({
            name: acc.name || acc.email,
            address: acc.wallets[0]?.address,
            avatar: acc.avatarUrl,
        }));

        const collections: CollectionSearchResults = {
            data: collectionData,
            total: totalCollections,
            isLastPage: isLastCollectionPage,
        };

        const users: UserSearchResults = {
            data: accountsData,
            total: totalUsers,
            isLastPage: isLastAccountsPage,
        };

        return {
            collections,
            users,
        };
    }
}
