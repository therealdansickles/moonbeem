import { Injectable } from '@nestjs/common';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter';
import {
    VGlobalSearchReqDto,
    VGlobalSearchRspDto,
    VSearchAccountItem,
    VSearchAccountRsp,
    VSearchCollectionItem,
    VSearchCollectionRsp,
} from './search.dto';
import { IRowCount } from '../lib/modules/db.module';
import {
    SearchAccountItem,
    SearchAccountItemV1,
    SearchCollectionItem,
    SearchCollectionItemV1,
} from '../lib/modules/db.record.module';

@Injectable()
export class SearchService {
    constructor(private readonly pgClient: PostgresAdapter) {}

    async executeGlobalSearch(searchArgs: VGlobalSearchReqDto): Promise<VGlobalSearchRspDto> {
        const page = searchArgs.page || 0;
        const pageSize = searchArgs.pageSize || 10;
        const offset = page * pageSize;

        const collectionSqlStr = `select * from collection as c where (lower(c.name) like '%${searchArgs.searchTerm.toLowerCase()}%' or lower(c.collection) like '%${searchArgs.searchTerm.toLowerCase()}%') and c.collection!='' fetch first ${pageSize} row only offset ${offset} rows`;
        const collectionSqlCountStr = `SELECT COUNT(*) FROM collection as c where (lower(c.name) like '%${searchArgs.searchTerm.toLowerCase()}%' or lower(c.collection) like '%${searchArgs.searchTerm.toLowerCase()}%') and c.collection!=''`;

        const collectionCountRsp = await this.pgClient.query<IRowCount>(collectionSqlCountStr);
        const collectionRsp = await this.pgClient.select<SearchCollectionItem>(collectionSqlStr);
        const isLastCollectionPage = collectionCountRsp.count - (offset + collectionRsp.length) <= 0;
        const collectionData: VSearchCollectionItem[] = collectionRsp.map((col) => ({
            name: col.name,
            image: col.avatar,
            address: col.collection,
            chainId: col.chain_id,
            itemsCount: col.tiers.reduce((sum, item) => (sum += item.endId - item.startId + 1), 0),
        }));

        const accountSqlStr = `select * from "UserWallet" where lower(address) like '%${searchArgs.searchTerm.toLowerCase()}%' OR lower(name) like '%${searchArgs.searchTerm.toLowerCase()}%' fetch first ${pageSize} row only offset ${offset} rows`;
        const accountSqlCountStr = `SELECT COUNT(*) FROM "UserWallet" where lower(address) like '%${searchArgs.searchTerm.toLowerCase()}%' or lower(name) like '%${searchArgs.searchTerm.toLowerCase()}%'`;

        const accountCountRsp = await this.pgClient.query<IRowCount>(accountSqlCountStr);
        const accountsRsp = await this.pgClient.select<SearchAccountItem>(accountSqlStr);
        const isLastAccountsPage = accountCountRsp.count - (offset + accountsRsp.length) <= 0;

        const accountsData: VSearchAccountItem[] = accountsRsp.map((acc) => ({
            name: acc.name,
            address: acc.address,
            avatar: acc.avatar,
        }));

        const collections: VSearchCollectionRsp = {
            data: collectionData,
            total: parseInt(collectionCountRsp.count.toString()),
            isLastPage: isLastCollectionPage,
        };

        const accounts: VSearchAccountRsp = {
            data: accountsData,
            total: parseInt(accountCountRsp.count.toString()),
            isLastPage: isLastAccountsPage,
        };

        return {
            collections,
            accounts,
        };
    }

    async executeGlobalSearchV1(searchArgs: VGlobalSearchReqDto): Promise<VGlobalSearchRspDto> {
        const page = searchArgs.page || 0;
        const pageSize = searchArgs.pageSize || 10;
        const offset = page * pageSize;

        const collectionSqlStr = `select * from "Collection" as c where (lower(c.name) like '%${searchArgs.searchTerm.toLowerCase()}%' or lower(c.address) like '%${searchArgs.searchTerm.toLowerCase()}%') and c.address!='' fetch first ${pageSize} row only offset ${offset} rows`;
        const collectionSqlCountStr = `SELECT COUNT(*) FROM "Collection" as c where (lower(c.name) like '%${searchArgs.searchTerm.toLowerCase()}%' or lower(c.address) like '%${searchArgs.searchTerm.toLowerCase()}%') and c.address!=''`;

        const collectionCountRsp = await this.pgClient.query<IRowCount>(collectionSqlCountStr);
        const collectionRsp = await this.pgClient.select<SearchCollectionItemV1>(collectionSqlStr);
        const isLastCollectionPage = collectionCountRsp.count - (offset + collectionRsp.length) <= 0;
        const collectionData: VSearchCollectionItem[] = collectionRsp.map((col) => ({
            name: col.name,
            image: col.avatarUrl,
            address: col.address,
            chainId: col.chainId,
            itemsCount: col.tiers?.reduce((sum, item) => (sum += item.endId - item.startId + 1), 0),
        }));

        const accountSqlStr = `select u.name,u.email,u."avatarUrl",w.address from "Wallet" as w inner join "User" as u on u.id = w."ownerId" where lower(w.address) like '%${searchArgs.searchTerm.toLowerCase()}%' OR lower(u.name) like '%${searchArgs.searchTerm.toLowerCase()}%' fetch first ${pageSize} row only offset ${offset} rows`;
        const accountSqlCountStr = `select COUNT(*) from "Wallet" as w inner join "User" as u on u.id = w."ownerId" where lower(w.address) like '%${searchArgs.searchTerm.toLowerCase()}%' OR lower(u.name) like '%${searchArgs.searchTerm.toLowerCase()}%'`;

        const accountCountRsp = await this.pgClient.query<IRowCount>(accountSqlCountStr);
        const accountsRsp = await this.pgClient.select<SearchAccountItemV1>(accountSqlStr);
        const isLastAccountsPage = accountCountRsp.count - (offset + accountsRsp.length) <= 0;

        const accountsData: VSearchAccountItem[] = accountsRsp.map((acc) => ({
            name: acc.name || acc.email,
            address: acc.address,
            avatar: acc.avatarUrl,
        }));

        const collections: VSearchCollectionRsp = {
            data: collectionData,
            total: parseInt(collectionCountRsp.count.toString()),
            isLastPage: isLastCollectionPage,
        };

        const accounts: VSearchAccountRsp = {
            data: accountsData,
            total: parseInt(accountCountRsp.count.toString()),
            isLastPage: isLastAccountsPage,
        };

        return {
            collections,
            accounts,
        };
    }
}
