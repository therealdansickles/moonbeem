import BigNumber from 'bignumber.js';
import { startOfMonth } from 'date-fns';
import { ethers, isAddress } from 'ethers';
import { GraphQLError } from 'graphql';
import { isEmpty, isNil, omit, omitBy } from 'lodash';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { captureException } from '@sentry/node';

import { Collection } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import {
    cursorToStrings, fromCursor, PaginatedImp, toPaginated
} from '../pagination/pagination.module';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import {
    MintSaleTransaction
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { BasicPriceInfo, Profit } from '../tier/tier.dto';
import { Tier } from '../tier/tier.entity';
import { User } from '../user/user.entity';
import {
    BindWalletInput, CreateWalletInput, EstimatedValue, Minted, MintPaginated, UnbindWalletInput,
    UpdateWalletInput, WalletSold, WalletSoldPaginated
} from './wallet.dto';
import { Wallet } from './wallet.entity';

interface ITokenPrice {
    token: string;
    price: string;
}

type IWalletQuery = Partial<Pick<Wallet, 'name' | 'address'>>;

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>,
        @InjectRepository(Collection) private collectionRepository: Repository<Collection>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Tier) private tierRepository: Repository<Tier>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private mintSaleTransactionRepository: Repository<MintSaleTransaction>,
        @InjectRepository(MintSaleContract, 'sync_chain')
        private mintSaleContractRepository: Repository<MintSaleContract>,
        private coinService: CoinService,
        private collectionService: CollectionService
    ) {}

    /**
     * This is the uuid for the ownerId for all unbound wallets, e.g the blackhole.
     */
    public readonly unOwnedId: string = '00000000-0000-0000-0000-000000000000';

    /**
     * A map of network names to chainIds.
     *
     * * https://eips.ethereum.org/EIPS/eip-3770
     * * https://chainid.network/shortNameMapping.json
     * * https://github.com/ethereum-lists/chains
     *
     * Currently we only support ethereum, matic, and arbitrum.
     */
    private readonly networkChainIdMap: { [key: string]: number } = {
        eth: 1,
        matic: 137,
        arb: 42161,
    };

    /**
     * Retrieves the wallet associated with the given uuid.
     *
     * @param id The uuid of the wallet to retrieve.
     * @returns The wallet associated with the given uuid.
     */
    async getWallet(id: string): Promise<Wallet> {
        return this.walletRepository.findOneBy({ id });
    }

    /**
     * Retrieves the wallet satisfied the given query.
     *
     * @param query The condition of the wallet to retrieve.
     * @returns The wallet satisfied the given query.
     */
    async getWalletByQuery(query: IWalletQuery): Promise<Wallet> {
        query = omitBy(query, isNil);
        if (isEmpty(query)) return null;
        if (query.address) query.address = query.address.toLowerCase();
        return this.walletRepository.findOneBy(query);
    }

    /**
     * check if the wallet is existed or not
     * if existed, return wallet info
     * else throw error
     *
     * @param address
     * @returns
     */
    async checkWalletExistence(address: string): Promise<Wallet> {
        const wallet = this.getWalletByQuery({ address });
        if (!wallet) throw new GraphQLError(`wallet ${address} doesn't exist.`);
        return wallet;
    }

    /**
     * Creates a new wallet with the given data.
     *
     * @param address The address of the wallet to create.
     * @returns The newly created wallet.
     */
    async createWallet(input: CreateWalletInput): Promise<Wallet> {
        const { ownerId, ...walletData } = input;
        if (walletData.name && isAddress(walletData.name))
            throw new GraphQLError(`Wallet name can't be in the address format.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        if (!walletData.name || walletData.name === '') {
            walletData.name = walletData.address.toLowerCase();
        }
        const existedWallet = await this.getWalletByQuery({ name: walletData.name });
        if (existedWallet)
            throw new GraphQLError(`Wallet name ${input.name} already existed.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        const wallet = await this.walletRepository.create({ owner: { id: ownerId }, ...walletData });
        const result = await this.walletRepository.insert(wallet);
        return await this.walletRepository.findOne({
            where: { id: result.identifiers[0].id },
            relations: ['owner'],
        });
    }

    /**
     * Update a wallet with the given data.
     * @param id
     * @param payload
     * @returns
     */
    async updateWallet(id: string, payload: Partial<Omit<UpdateWalletInput, 'id'>>): Promise<Wallet> {
        const wallet = await this.walletRepository.findOneBy({ id });
        const walletUpdate: Partial<Wallet> = { ...wallet, ...payload };
        if (!wallet) {
            throw new GraphQLError(`Wallet with id ${id} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }
        if (payload.name && payload.name !== '') {
            if (isAddress(payload.name) && payload.name.toLowerCase() !== wallet.address.toLowerCase())
                throw new GraphQLError(`Wallet name can't be in the address format.`, {
                    extensions: { code: 'BAD_REQUEST' },
                });
            const existedWallet = await this.getWalletByQuery({ name: payload.name });
            if (existedWallet && existedWallet.id !== id)
                throw new GraphQLError(`Wallet name ${payload.name} already existed.`, {
                    extensions: { code: 'BAD_REQUEST' },
                });
        }
        if (payload.ownerId) {
            walletUpdate.owner = { id: payload.ownerId } as User;
        }

        try {
            return this.walletRepository.save(walletUpdate);
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to update wallet ${id}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Changes the owner of the wallet to the provided user id.
     * If the wallet doesn't exist, it will be created.
     *
     * @param data The data to use when binding a wallet.
     * @returns The wallet that was bound to the user.
     */
    async bindWallet(data: BindWalletInput): Promise<Wallet> {
        const { address: rawAddress, owner } = data;
        const address = rawAddress.toLowerCase();
        const wallet = await this.verifyWallet(address, data.message, data.signature);

        if (wallet.owner?.id)
            throw new Error(
                `The wallet at ${address} is already connected to an existing account. Please connect another wallet to this account.`
            );

        await this.updateWallet(wallet.id, { ...omit(wallet, 'owner'), ownerId: owner.id });
        return this.walletRepository.findOne({
            where: { address },
            relations: ['owner'],
        });
    }

    /**
     * Unbinds the wallet for the given address.
     * If the wallet doesn't exist, it will be created.
     *
     * @param data The data to use when unbinding a wallet.
     * @returns The wallet that was bound to the user.
     */
    async unbindWallet(data: UnbindWalletInput): Promise<Wallet> {
        const { address, owner } = data;
        let wallet = await this.walletRepository.findOne({
            where: { address: address.toLowerCase() },
            relations: ['owner'],
        });
        if (!wallet) {
            wallet = new Wallet();
            wallet.address = address;
        }
        if (wallet?.owner && wallet?.owner?.id !== owner?.id) {
            throw new GraphQLError(`Wallet ${address} doesn't belong to the given user.`, {
                extensions: { code: 'FORBIDDEN' },
            });
        }

        try {
            await this.updateWallet(wallet.id, { ...omit(wallet, 'owner'), ownerId: this.unOwnedId });
            return this.walletRepository.findOne({
                where: { address },
                relations: ['owner'],
            });
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to unbind wallet ${address}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Verifies that the given address signed the given message.
     *
     * @param walletAddress The address to verify.
     * @param message The message that was signed.
     * @param signature The signature of the message.
     * @returns a Wallet object.
     */
    async verifyWallet(walletAddress: string, message: string, signature: string): Promise<Wallet | null> {
        const address = walletAddress.toLowerCase();
        if (ethers.verifyMessage(message, signature).toLowerCase() === address) {
            const existedWallet = await this.walletRepository.findOne({
                where: { address },
                relations: ['owner'],
            });
            if (existedWallet) return existedWallet;
            else {
                await this.walletRepository.insert({ address, name: address });
                return this.walletRepository.findOne({
                    where: { address },
                    relations: ['owner'],
                });
            }
        }
        return null;
    }

    /**
     * Parses out the given EIP-3770 address into the network and chainId information, if possible.
     *
     * @param address The address to parse.
     * @return a Wallet object with the address, network, and chainId. If no network is found, defaults to ethereum.
     */
    parseEIP3770Address(eip3770Address: string): Partial<Wallet> {
        let [network, address] = eip3770Address.split(':');
        address === undefined && ([network, address] = ['eth', network]); // default to ethereum if no network included.

        const chainId = this.networkChainIdMap[network.toLowerCase()] || Number(network);

        if (isNaN(chainId)) {
            throw new GraphQLError(`address ${eip3770Address} is not a valid ethereum or EIP-3770 address`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        return { address };
    }

    /**
     * Retrieves the mint sale transactions associated with the given address.(from the sync-chain).
     * `Minted` here is the actual NFT minted, which includes the the transaction details,
     * the NFT details itself via the `tier` and the `collection` associated with it.
     *
     * @param address The address of the wallet to retrieve.
     * @param before The cursor to retrieve the next page of results.
     * @param after The cursor to retrieve the previous page of results.
     * @param first The number of results to retrieve, work with after together
     * @param last The number of results to retrieve, work with before together
     * @returns The `Minted` details + mint sale transactions associated with the given address.
     */
    async getMintedByAddress(
        address: string,
        before: string,
        after: string,
        first: number,
        last: number
    ): Promise<MintPaginated> {
        const wallet = await this.getWalletByQuery({ address });
        if (!wallet) throw new Error(`Wallet with address ${address} doesn't exist.`);

        const builder = await this.mintSaleTransactionRepository.createQueryBuilder('tx');
        builder.where('tx.recipient = :address', { address });
        const countBuilder = builder.clone();

        if (after) {
            const [createdAt, id] = cursorToStrings(after);
            // We assume that the createdAt can be duplicated, use >= instead of > here
            builder.andWhere('tx.createdAt > :createdAt', { createdAt });
            builder.orWhere('tx.createdAt = :createdAt AND tx.id > :id', { createdAt, id });
            builder.orderBy('tx.createdAt', 'ASC');
            builder.addOrderBy('tx.id', 'ASC');
            builder.limit(first);
        } else if (before) {
            const [createdAt, id] = cursorToStrings(after);
            builder.andWhere('tx.createdAt < :createdAt', { createdAt });
            builder.orWhere('tx.createdAt = :createdAt AND tx.id < :id', { createdAt, id });
            builder.orderBy('tx.createdAt', 'DESC');
            builder.addOrderBy('tx.id', 'DESC');
            builder.limit(last);
        } else {
            const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
            builder.limit(limit);
        }

        const [mintSaleTransactions, total] = await Promise.all([builder.getMany(), countBuilder.getCount()]);

        const mintedList: Minted[] = await Promise.all(
            mintSaleTransactions.map(async (mintSaleTransaction) => {
                const { tierId, address } = mintSaleTransaction;

                const tier = await this.tierRepository
                    .createQueryBuilder('tier')
                    .leftJoinAndSelect('tier.collection', 'collection')
                    .leftJoinAndSelect('collection.collaboration', 'collaboration')
                    .where('collection.address = :address', { address })
                    .andWhere('tier.tierId = :tierId', { tierId })
                    .getOne();

                return { ...mintSaleTransaction, tier };
            })
        );

        return toPaginated(mintedList, total);
    }

    /**
     *
     * The `Minted` list + `Deploy` list
     *
     * @param address
     * @returns
     */
    async getActivitiesByAddress(address: string): Promise<any> {
        const wallet = await this.getWalletByQuery({ address });
        if (!wallet) throw new Error(`Wallet with address ${address} doesn't exist.`);

        // TODO:
        // it would be difficult if we want to paginate for the service
        const [mintedTransactions, deployedTransactions] = await Promise.all([
            this.mintSaleTransactionRepository.find({ where: { recipient: address } }),
            this.mintSaleContractRepository.find({ where: { sender: address } }),
        ]);

        const mintList = mintedTransactions.map((tx) => ({
            type: 'Mint',
            txTime: tx.txTime,
            txHash: tx.txHash,
            chainId: tx.chainId,
            address: tx.address,
            paymentToken: tx.paymentToken,
            price: tx.price,
            tokenId: tx.tokenId,
            tierId: tx.tierId,
        }));
        const deployList = deployedTransactions.map((tx) => ({
            type: 'Deploy',
            txTime: tx.txTime,
            txHash: tx.txHash,
            chainId: tx.chainId,
            address: tx.address,
            paymentToken: tx.paymentToken,
            price: tx.price,
            tierId: tx.tierId,
        }));

        // merge and sort in desc order
        const mergedList = [...(mintList || []), ...(deployList || [])].sort((a, b) => b.txTime - a.txTime);

        const activities = await Promise.all(
            mergedList.map(async (item) => {
                const { tierId, address } = item;
                const tier = await this.tierRepository
                    .createQueryBuilder('tier')
                    .leftJoinAndSelect('tier.collection', 'collection')
                    .where('collection.address = :address', { address })
                    .andWhere('tier.tierId = :tierId', { tierId })
                    .getOne();

                return { ...item, tier };
            })
        );
        return activities;
    }

    /**
     *
     * @param address
     * @returns
     */
    async getEstimatesByAddress(address: string): Promise<EstimatedValue[]> {
        const values: EstimatedValue[] = [];
        const wallet = await this.getWalletByQuery({ address });
        if (!wallet) throw new Error(`Wallet with address ${address} doesn't exist.`);

        const priceTokenGroups = await this.getValueGroupByToken(address);

        for (const group of priceTokenGroups) {
            const coin = await this.coinService.getCoinByAddress(group.token);
            const quote = await this.coinService.getQuote(coin.symbol);
            const usdPrice = quote['USD'].price;
            const price = group?.price || '0';
            const totalTokenPrice = new BigNumber(price).div(new BigNumber(10).pow(coin.decimals));

            values.push({
                paymentTokenAddress: group.token,
                total: totalTokenPrice.toString(),
                totalUSDC: new BigNumber(totalTokenPrice).multipliedBy(usdPrice).toString(),
            });
        }

        return values;
    }

    /**
     *
     * @param address
     * @returns
     */
    async getValueGroupByToken(address: string): Promise<Array<ITokenPrice>> {
        try {
            const records = await this.mintSaleContractRepository
                .createQueryBuilder('mintSaleContract')
                .select([])
                .innerJoinAndSelect(
                    'MintSaleTransaction',
                    'mintSaleTransaction',
                    'mintSaleTransaction.address = mintSaleContract.address AND mintSaleTransaction.tierId = mintSaleContract.tierId'
                )
                .select([])
                .where('mintSaleContract.sender = :address', { address })
                .addSelect('SUM("mintSaleTransaction".price::decimal(30,0))', 'price')
                .addSelect('mintSaleTransaction.paymentToken', 'token')
                .groupBy('mintSaleTransaction.paymentToken')
                .getRawMany();
            return records;
        } catch (e) {
            captureException(e);
            return [];
        }
    }

    async getSold(
        address: string,
        before: string,
        after: string,
        first: number,
        last: number
    ): Promise<WalletSoldPaginated> {
        const collections = await this.collectionService.getCreatedCollectionsByWalletAddress(address);

        if (collections.length <= 0) return PaginatedImp([], 0);

        const builder = this.mintSaleTransactionRepository.createQueryBuilder('txn');
        builder.where('address IN (:...addresses)', {
            addresses: collections.map((c) => {
                return c.address;
            }),
        });
        const countBuilder = builder.clone();

        if (after) {
            builder.andWhere('txn.createdAt > :cursor', { cursor: fromCursor(after) });
            builder.limit(first);
        } else if (before) {
            builder.andWhere('txn.createdAt < :cursor', { cursor: fromCursor(before) });
            builder.limit(last);
        } else {
            const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
            builder.limit(limit);
        }

        const [transactions, total] = await Promise.all([builder.getMany(), countBuilder.getCount()]);
        const data: WalletSold[] = await Promise.all(
            transactions.map(async (txn) => {
                const tier = await this.tierRepository.findOne({ where: { tierId: txn.tierId } });
                return {
                    ...txn,
                    tier: tier,
                };
            })
        );

        return PaginatedImp(data, total);
    }

    public async getWalletProfit(address: string): Promise<Profit[]> {
        const collections = await this.collectionService.getCreatedCollectionsByWalletAddress(address);

        if (collections.length <= 0) return [];

        const result = await this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select('SUM("txn".price::decimal(30,0))', 'price')
            .addSelect('txn.paymentToken', 'token')
            .where('txn.address IN (:...addresses)', {
                addresses: collections.map((c) => {
                    if (c.address) return c.address;
                }),
            })
            .groupBy('txn.paymentToken')
            .getRawMany();

        const data = await Promise.all(
            result.map(async (item) => {
                const itemData = item as BasicPriceInfo;
                const coin = await this.coinService.getCoinByAddress(itemData.token.toLowerCase());

                const totalTokenPrice = new BigNumber(itemData.price).div(new BigNumber(10).pow(coin.decimals));
                const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(coin.derivedUSDC);
                return {
                    inPaymentToken: totalTokenPrice.toString(),
                    inUSDC: totalUSDC.toString(),
                };
            })
        );

        return data;
    }

    async getMonthlyBuyers(address: string): Promise<number> {
        const collections = await this.collectionService.getCreatedCollectionsByWalletAddress(address);

        if (collections.length <= 0) return 0;
        const beginDate = startOfMonth(new Date());

        const total = await this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            // txTime is a timestamp that needs to be converted to a date type
            .where('txn.address IN (:...addresses)', {
                addresses: collections.map((c) => {
                    if (c.address) return c.address;
                }),
            })
            .andWhere('TO_TIMESTAMP(txn.txTime) >= :beginDate', { beginDate })
            .getCount();
        return total;
    }

    public async getMonthlyCollections(address: string): Promise<number> {
        const beginDate = startOfMonth(new Date());

        const total = await this.collectionRepository
            .createQueryBuilder('collection')
            .leftJoinAndSelect('collection.creator', 'wallet')
            .where('wallet.address = :address', { address })
            .andWhere('collection.createdAt >= :beginDate', { beginDate })
            .getCount();
        return total;
    }

    public async getMonthlyEarnings(address: string): Promise<number> {
        const collections = await this.collectionService.getCreatedCollectionsByWalletAddress(address);

        if (collections.length <= 0) return 0;
        const beginDate = startOfMonth(new Date());

        const result = await this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select('txn.paymentToken', 'token')
            .addSelect('SUM(txn.price::numeric(20,0))', 'total_price')
            .where('txn.address IN (:...addresses)', {
                addresses: collections.map((c) => {
                    if (c.address) return c.address;
                }),
            })
            .andWhere('TO_TIMESTAMP(txn.txTime) >= :beginDate', { beginDate })
            .addGroupBy('txn.paymentToken')
            .getRawMany();

        const totalEarning = result.reduce(async (accumulator, current) => {
            const coin = await this.coinService.getCoinByAddress(current.token);
            const quote = await this.coinService.getQuote(coin.symbol);
            const usdPrice = quote['USD'].price;

            const totalTokenPrice = new BigNumber(current.total_price).div(new BigNumber(10).pow(coin.decimals));
            const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(usdPrice);
            return accumulator + totalUSDC;
        }, 0);
        return totalEarning;
    }
}
