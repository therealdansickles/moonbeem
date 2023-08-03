import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { captureException } from '@sentry/node';
import { generate as generateString } from 'randomstring';
import BigNumber from 'bignumber.js';
import { Organization, OrganizationKind } from './organization.entity';
import {
    AggregatedBuyer,
    AggregatedEarning,
    CollectionStatFromOrganization,
    CreateOrganizationInput,
    OrganizationEarningsChartPaginated,
    OrganizationLatestSalePaginated,
    OrganizationProfit,
    UpdateOrganizationInput,
} from './organization.dto';
import { User } from '../user/user.entity';
import { GraphQLError } from 'graphql';
import { MembershipService } from '../membership/membership.service';
import { CollectionService } from '../collection/collection.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { CoinService } from '../sync-chain/coin/coin.service';
import { startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { BasicTokenPrice } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.dto';
import { Collection } from '../collection/collection.entity';
import { cursorToStrings, fromCursor, PaginatedImp } from '../pagination/pagination.module';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Tier } from '../tier/tier.entity';

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(Organization) private organizationRepository: Repository<Organization>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Tier) private tierRepository: Repository<Tier>,
        @InjectRepository(Collection) private collectionRepository: Repository<Collection>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private mintSaleTransactionRepository: Repository<MintSaleTransaction>,
        private membershipService: MembershipService,
        private collectionService: CollectionService,
        private coinService: CoinService,
        private mintSaleTransactionService: MintSaleTransactionService
    ) {}

    /**
     * Retrieve an organization by id.
     *
     * @param id The id of the organization to retrieve.
     * @returns The organization.
     */
    async getOrganization(id: string): Promise<Organization> {
        return await this.organizationRepository.findOneBy({ id });
    }

    /**
     * Create a new organization.
     *
     * @param data The data to create the organization with.
     * @returns The created organization..
     */
    async createOrganization(data: CreateOrganizationInput): Promise<Organization> {
        const orgWithSameName = await this.organizationRepository.findOneBy({ name: data.name });
        if (orgWithSameName) {
            throw new GraphQLError(`Organization with name ${data.name} already existed.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        const owner = await this.userRepository.findOneBy({ id: data.owner.id });

        const organization = await this.organizationRepository.save(data);
        await this.membershipService.createMembership(owner.email, {
            organization,
            canEdit: true,
            canDeploy: true,
            canManage: true,
        });

        return await this.organizationRepository.findOne({
            where: { id: organization.id },
            relations: ['owner'],
        });
    }

    /**
     * Create a default (personal) organization for a user.
     *
     * @param user The user to create the default organization for.
     * @returns The created default organization.
     */
    async createPersonalOrganization(user: User): Promise<Organization> {
        const pseudoOrgName = generateString(12);
        const defaultOrgPayload = {
            name: pseudoOrgName,
            displayName: pseudoOrgName,
            kind: OrganizationKind.personal,
            owner: { id: user.id },
        };

        return await this.createOrganization(defaultOrgPayload);
    }

    /**
     * Update an organization.
     *
     * @param id The id of the organization to update.
     * @param data The data to update the organization with.
     * @returns The updated organization.
     */
    async updateOrganization(id: string, data: Omit<UpdateOrganizationInput, 'id'>): Promise<Organization> {
        const organization = await this.organizationRepository.findOneBy({ id });
        if (!organization) {
            throw new GraphQLError(`Organization with id ${id} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }
        // if name is need to be updated, then check if it's uniqueness first
        if (data.name) {
            const orgWithSameName = await this.organizationRepository.findOneBy({ name: data.name });
            if (orgWithSameName) {
                throw new GraphQLError(`Organization with name ${data.name} already existed.`, {
                    extensions: { code: 'BAD_REQUEST' },
                });
            }
        }

        try {
            await this.organizationRepository.save({ ...organization, ...data });
            return await this.organizationRepository.findOne({
                where: { id: organization.id },
                relations: ['owner'],
            });
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to update organization ${id}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Retrieve organizations by owner id.
     *
     * @param ownerId The id of the user to retrieve owned organizations for.
     * @returns The organizations.
     */
    async getOrganizationsByOwnerId(ownerId: string): Promise<Organization[]> {
        return await this.organizationRepository.find({
            where: { owner: { id: ownerId } },
        });
    }

    /**
     * TODO: Fix this and make it a soft deletion.
     *
     * Deletes a organization if it is not published.
     *
     * @param id The id of the organization to delete.
     * @returns true if the organization was deleted, false otherwise.
     */
    async deleteOrganization(id: string): Promise<boolean> {
        const memberships = await this.membershipService.getMembershipsByOrganizationId(id);
        if (memberships.length > 1) {
            throw new GraphQLError('Organization contains more than two memberships.', {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        let deleteMembershipAffected = true;
        if (memberships.length == 1) {
            deleteMembershipAffected = await this.membershipService.deleteMembership(memberships[0].id);
        }

        const result = await this.organizationRepository.delete({ id });
        return deleteMembershipAffected && result.affected > 0;
    }

    /**
     * Transfer an organization to another user.
     *
     * @param id The id of the organization to transfer.
     * @param ownerId The id of the user to transfer the organization to.
     * @returns The updated organization.
     */
    async transferOrganization(id: string, ownerId: string): Promise<Organization> {
        const organization = await this.organizationRepository.findOneBy({ id });
        if (!organization) {
            throw new GraphQLError(`Organization with id ${id} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        const owner = await this.userRepository.findOneBy({ id: ownerId });
        if (!owner) {
            throw new GraphQLError(`User with id ${ownerId} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        organization.owner = owner;

        try {
            return this.organizationRepository.save(organization);
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to transfer organization ${id} to user ${ownerId}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * get all buyers for all collections created by this organization
     * @param id organization id
     * @returns number of buyers
     */
    async getAggregatedBuyers(id: string): Promise<AggregatedBuyer> {
        const collections = await this.collectionService.getCollectionsByOrganizationId(id);

        const addresses = collections.map((c) => {
            if (c.address) return c.address;
        });

        const [monthly, weekly, daily] = await Promise.all([
            this.mintSaleTransactionService.getBuyersByCollectionAddressesAndBeginTime(
                addresses,
                startOfMonth(new Date())
            ),
            this.mintSaleTransactionService.getBuyersByCollectionAddressesAndBeginTime(
                addresses,
                startOfWeek(new Date())
            ),
            this.mintSaleTransactionService.getBuyersByCollectionAddressesAndBeginTime(
                addresses,
                startOfDay(new Date())
            ),
        ]);
        return { monthly, weekly, daily };
    }

    /**
     * get aggregated data of earnings by organization
     * @param id organization id
     * @returns total earnings in usd
     */
    public async getAggregatedEarnings(id: string): Promise<AggregatedEarning> {
        const collections = await this.collectionService.getCollectionsByOrganizationId(id);

        const addresses = collections.map((c) => {
            if (c.address) return c.address;
        });

        const [monthlyEarning, weeklyEarning, dailyEarning] = await Promise.all([
            this.mintSaleTransactionService.getEarningsByCollectionAddressesAndBeginTime(
                addresses,
                startOfMonth(new Date())
            ),
            this.mintSaleTransactionService.getEarningsByCollectionAddressesAndBeginTime(
                addresses,
                startOfWeek(new Date())
            ),
            this.mintSaleTransactionService.getEarningsByCollectionAddressesAndBeginTime(
                addresses,
                startOfDay(new Date())
            ),
        ]);

        const [monthly, weekly, daily] = await Promise.all([
            this.calculateUSDPrice(monthlyEarning),
            this.calculateUSDPrice(weeklyEarning),
            this.calculateUSDPrice(dailyEarning),
        ]);
        return { monthly: monthly.toNumber(), weekly: weekly.toNumber(), daily: daily.toNumber() };
    }

    /**
     * get usd price based on tokan price.
     * @param prices A list with paymentToken and totalPrice
     * @returns total usd price
     */
    public async calculateUSDPrice(prices: BasicTokenPrice[]): Promise<BigNumber> {
        return await prices.reduce(async (accumulatorPromise, current) => {
            const accumulator = await accumulatorPromise;
            const coin = await this.coinService.getCoinByAddress(current.token);
            const quote = await this.coinService.getQuote(coin.symbol);
            const usdPrice = quote['USD'].price;

            const totalTokenPrice = new BigNumber(current.totalPrice).div(new BigNumber(10).pow(coin.decimals));
            const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(usdPrice);
            return accumulator.plus(totalUSDC);
        }, Promise.resolve(new BigNumber(0)));
    }

    /**
     * Total Profit from organization
     *
     * @param id organization id
     * @returns profit in payment token and usd
     */
    async getOrganizationProfit(id: string): Promise<OrganizationProfit[]> {
        const collections = await this.collectionService.getCollectionsByOrganizationId(id);
        if (collections.length == 0) return [];

        const result = await this.mintSaleTransactionService.getTotalSalesByCollectionAddresses(
            collections.map((c) => {
                if (c.address) return c.address;
            })
        );

        const data = await Promise.all(
            result.map(async (item) => {
                const coin = await this.coinService.getCoinByAddress(item.token);
                const totalTokenPrice = new BigNumber(item.totalPrice).div(new BigNumber(10).pow(coin.decimals));
                const quote = await this.coinService.getQuote(coin.symbol);
                const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(quote['USD'].price);
                return {
                    paymentToken: item.token,
                    inPaymentToken: totalTokenPrice.toString(),
                    inUSDC: totalUSDC.toString(),
                };
            })
        );
        return data;
    }

    /**
     * get total collections for the given user.
     *
     * @param id user id
     * @returns collection count
     */
    async getTotalCollections(id: string): Promise<number> {
        return await this.collectionRepository.count({ where: { organization: { id } } });
    }

    /**
     *
     * @param id organization id
     * @returns
     */
    async getItemSold(id: string): Promise<number> {
        const collections = await this.collectionService.getCollectionsByOrganizationId(id);
        if (collections.length == 0) return 0;

        return await this.mintSaleTransactionService.getTotalItemByCollectionAddresses(
            collections.map((c) => {
                if (c.address) return c.address;
            })
        );
    }

    /**
     * get unique buyers for the given organization
     * @param id user id
     * @returns unique buyers
     */
    async getUniqueBuyers(id: string): Promise<number> {
        const collections = await this.collectionService.getCollectionsByOrganizationId(id);
        if (collections.length == 0) return 0;

        return await this.mintSaleTransactionService.getUniqueRecipientByCollectionAddresses(
            collections.map((c) => {
                if (c.address) return c.address;
            })
        );
    }

    /**
     * sales histories in all collections created by this organization
     *
     * @param id organization id
     * @param before before cursor
     * @param after after cursor
     * @param first first limit
     * @param last limit
     * @returns LatestSalePaginated object
     */
    async getLatestSales(
        id: string,
        before: string,
        after: string,
        first: number,
        last: number
    ): Promise<OrganizationLatestSalePaginated> {
        const collections = await this.collectionService.getCollectionsByOrganizationId(id);
        if (collections.length == 0) return PaginatedImp([], 0);

        const addresses = collections.map((c) => {
            if (c.address) return c.address;
        });

        if (addresses.length > 0) {
            const builder = await this.mintSaleTransactionRepository
                .createQueryBuilder('txn')
                .select('txn.txHash', 'txHash')
                .addSelect('COUNT(1)', 'quantity')
                .addSelect('SUM("txn".price::decimal(30,0))', 'totalPrice')
                .addSelect('txn.recipient', 'recipient')
                .addSelect('txn.txTime', 'txTime')
                .addSelect('txn.tierId', 'tierId')
                .addSelect('txn.address', 'address')
                .addSelect('txn.paymentToken', 'paymentToken')
                .where('txn.address IN (:...addresses)', { addresses })
                .groupBy('txn.txHash')
                .addGroupBy('txn.txTime')
                .addGroupBy('txn.recipient')
                .addGroupBy('txn.tierId')
                .addGroupBy('txn.address')
                .addGroupBy('txn.paymentToken')
                .orderBy('txn.txTime', 'DESC');

            if (after) {
                builder.andWhere('asset.txTime > :cursor', { cursor: new Date(fromCursor(after)).valueOf() / 1000 });
                builder.limit(first);
            } else if (before) {
                builder.andWhere('asset.txTime < :cursor', { cursor: fromCursor(before) });
                builder.limit(last);
            } else {
                const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
                builder.limit(limit);
            }

            const subquery = this.mintSaleTransactionRepository
                .createQueryBuilder('txn')
                .select('txn.recipient', 'recipient')
                .where('txn.address IN (:...addresses)', { addresses })
                .groupBy('txn.txHash')
                .addGroupBy('txn.txTime')
                .addGroupBy('txn.recipient')
                .addGroupBy('txn.tierId')
                .addGroupBy('txn.address')
                .addGroupBy('txn.paymentToken');

            const [result, totalResult] = await Promise.all([
                builder.getRawMany(),
                this.mintSaleTransactionRepository.manager.query(
                    `SELECT COUNT(1) AS "total" FROM (${subquery.getSql()}) AS subquery`,
                    addresses
                ),
            ]);

            const dd = await Promise.all(
                result.map(async (item) => {
                    const { tierId, paymentToken, totalPrice, quantity, ...rest } = item;
                    const collection = collections.find((c) => c.address == item.address);
                    const tier = await this.tierRepository.findOneBy({
                        tierId: tierId,
                        collection: { id: collection.id },
                    });
                    const coin = await this.coinService.getCoinByAddress(paymentToken);
                    const quote = await this.coinService.getQuote(coin.symbol);
                    const totalTokenPrice = new BigNumber(totalPrice).div(new BigNumber(10).pow(coin.decimals));
                    const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(quote['USD'].price);

                    const createdAt = new Date(item.txTime * 1000);
                    return {
                        quantity: parseInt(quantity),
                        ...rest,
                        tier,
                        collection,
                        paymentToken,
                        totalPrice: {
                            inPaymentToken: totalTokenPrice.toString(),
                            inUSDC: totalUSDC.toString(),
                        },
                        createdAt: new Date(createdAt.getTime() + createdAt.getTimezoneOffset() * 60 * 1000),
                    };
                })
            );
            return PaginatedImp(dd, totalResult.length > 0 ? parseInt(totalResult[0].total ?? 0) : 0);
        }

        return PaginatedImp([], 0);
    }

    async getCollectionStat(id: string): Promise<CollectionStatFromOrganization> {
        const current = Math.floor(new Date().valueOf() / 1000);
        const [total, live, closed] = await Promise.all([
            this.collectionRepository.count({ where: { organization: { id } } }),
            this.collectionRepository
                .createQueryBuilder('collection')
                .where('collection.organizationId = :id', { id })
                .andWhere('collection.beginSaleAt <= :current AND collection.endSaleAt >= :current', { current })
                .getCount(),
            this.collectionRepository
                .createQueryBuilder('collection')
                .where('collection.organizationId = :id', { id })
                .andWhere('collection.endSaleAt <= :current', { current })
                .getCount(),
        ]);
        return { total, live, closed };
    }

    async getOrganizationEarningsChart(
        id: string,
        before: string,
        after: string,
        first: number,
        last: number
    ): Promise<OrganizationEarningsChartPaginated> {
        const collections = await this.collectionService.getCollectionsByOrganizationId(id);
        if (collections.length == 0) return PaginatedImp([], 0);
        const addresses = collections.map((c) => {
            if (c.address) return c.address;
        });

        const builder = this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select(`EXTRACT(EPOCH FROM DATE(TO_TIMESTAMP("txTime")))`, 'time')
            .addSelect('SUM(txn.price::NUMERIC)', 'totalPrice')
            .addSelect('txn.paymentToken', 'paymentToken')
            .where('txn.address IN (:...addresses)', { addresses })
            .groupBy('time')
            .addGroupBy('txn.paymentToken')
            .orderBy('time', 'DESC');

        if (after) {
            const [_createdAt, id] = cursorToStrings(after);
            builder.andWhere(`DATE_TRUNC('day', TO_TIMESTAMP(txn."txTime")) * 1000 > :cursorTime`, { id });
            builder.limit(first);
        } else if (before) {
            const [_createdAt, id] = cursorToStrings(after);
            builder.andWhere(`DATE_TRUNC('day', TO_TIMESTAMP(txn."txTime")) * 1000 < :cursorTime`, { id });
            builder.limit(last);
        } else {
            const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
            builder.limit(limit);
        }

        const subquery = this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select(`EXTRACT(EPOCH FROM DATE(TO_TIMESTAMP("txTime")))`, 'time')
            .addSelect('SUM(txn.price::NUMERIC)', 'totalPrice')
            .addSelect('txn.paymentToken', 'paymentToken')
            .where('txn.address IN (:...addresses)', { addresses })
            .groupBy('time')
            .addGroupBy('txn.paymentToken');

        const [result, totalResult] = await Promise.all([
            builder.getRawMany(),
            this.mintSaleTransactionRepository.manager.query(
                `SELECT COUNT(1) AS "total" FROM (${subquery.getSql()}) AS subquery`,
                addresses
            ),
        ]);

        const data = await Promise.all(
            result.map(async (item) => {
                const coin = await this.coinService.getCoinByAddress(item.paymentToken);
                const quote = await this.coinService.getQuote(coin.symbol);
                const totalTokenPrice = new BigNumber(item.totalPrice).div(new BigNumber(10).pow(coin.decimals));
                const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(quote['USD'].price);
                return {
                    id: item.time.toString(),
                    createdAt: new Date(item.time * 1000),
                    time: item.time,
                    volume: {
                        inUSDC: totalUSDC.toString(),
                    },
                };
            })
        );
        const total = totalResult.length > 0 ? parseInt(totalResult[0].total ?? 0) : 0;
        return PaginatedImp(data, total);
    }
}
