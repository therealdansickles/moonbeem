import { Injectable } from '@nestjs/common';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter';
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
        private readonly pgClient: PostgresAdapter,
        @InjectRepository(Collection) private collectionRepository: Repository<Collection>,
        @InjectRepository(User) private userRepository: Repository<User>
    ) {}

    async executeGlobalSearch(input: GloablSearchInput): Promise<GlobalSearchResult> {
        const page = input.page || 0;
        const pageSize = input.pageSize || 10;
        const offset = page * pageSize;
        const searchTerm = input.searchTerm.toLowerCase();

        const collectionSqlStr = `select * from collection as c where (lower(c.name) like '%${searchTerm}%' or lower(c.collection) like '%${searchTerm}%') and c.collection!='' fetch first ${pageSize} row only offset ${offset} rows`;
        const collectionSqlCountStr = `SELECT COUNT(*) FROM collection as c where (lower(c.name) like '%${searchTerm}%' or lower(c.collection) like '%${searchTerm}%') and c.collection!=''`;

        const collectionCountRsp = await this.pgClient.query<IRowCount>(collectionSqlCountStr);
        const collectionRsp = await this.pgClient.select<SearchCollectionItem>(collectionSqlStr);
        const isLastCollectionPage = collectionCountRsp.count - (offset + collectionRsp.length) <= 0;
        const collectionData: CollectionSearchResult[] = collectionRsp.map((col) => ({
            name: col.name,
            image: col.avatar,
            address: col.collection,
            chainId: col.chain_id,
            itemsCount: col.tiers.reduce((sum, item) => (sum += item.endId - item.startId + 1), 0),
        }));

        const accountSqlStr = `select * from "UserWallet" where lower(address) like '%${searchTerm}%' OR lower(name) like '%${searchTerm}%' fetch first ${pageSize} row only offset ${offset} rows`;
        const accountSqlCountStr = `SELECT COUNT(*) FROM "UserWallet" where lower(address) like '%${searchTerm}%' or lower(name) like '%${searchTerm}%'`;

        const accountCountRsp = await this.pgClient.query<IRowCount>(accountSqlCountStr);
        const accountsRsp = await this.pgClient.select<SearchAccountItem>(accountSqlStr);
        const isLastAccountsPage = accountCountRsp.count - (offset + accountsRsp.length) <= 0;

        const accountsData: UserSearchResult[] = accountsRsp.map((acc) => ({
            name: acc.name,
            address: acc.address,
            avatar: acc.avatar,
        }));

        const collections: CollectionSearchResults = {
            data: collectionData,
            total: parseInt(collectionCountRsp.count.toString()),
            isLastPage: isLastCollectionPage,
        };

        const users: UserSearchResults = {
            data: accountsData,
            total: parseInt(accountCountRsp.count.toString()),
            isLastPage: isLastAccountsPage,
        };

        return {
            collections,
            users,
        };
    }

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
