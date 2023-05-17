import { GraphQLError } from 'graphql';
import { HttpException, HttpStatus, Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ethers } from 'ethers';
import BigNumber from 'bignumber.js';
import { captureException } from '@sentry/node';

import {
    BindWalletInput,
    CreateWalletInput,
    UnbindWalletInput,
    Minted,
    UpdateWalletInput,
    EstimatedValue,
} from './wallet.dto';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { User } from '../user/user.entity';
import { Wallet } from './wallet.entity';
import { Tier } from '../tier/tier.entity';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { CoinService } from '../sync-chain/coin/coin.service';

interface ITokenPrice {
    token: string;
    price: string;
}

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(Wallet) private walletRespository: Repository<Wallet>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Tier) private tierRepository: Repository<Tier>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private mintSaleTransactionRepository: Repository<MintSaleTransaction>,
        @InjectRepository(MintSaleContract, 'sync_chain')
        private mintSaleContractRepository: Repository<MintSaleContract>,
        private coinService: CoinService
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
        return this.walletRespository.findOneBy({ id });
    }

    /**
     * Retrieves the wallet associated with the given address.
     *
     * @param address The address of the wallet to retrieve.
     * @returns The wallet associated with the given address.
     */
    async getWalletByAddress(address: string): Promise<Wallet> {
        return this.walletRespository.findOneBy({ address: address.toLowerCase() });
    }

    /**
     * Creates a new wallet with the given data.
     *
     * @param address The address of the wallet to create.
     * @returns The newly created wallet.
     */
    async createWallet(input: CreateWalletInput): Promise<Wallet> {
        try {
            let owner;
            if (input.ownerId) {
                owner = await this.userRepository.findOneBy({ id: input.ownerId });
                if (!owner) {
                    throw new GraphQLError(`User with id ${input.ownerId} doesn't exist.`, {
                        extensions: { code: 'BAD_REQUEST' },
                    });
                }
            } else {
                owner = { id: this.unOwnedId };
            }

            return this.walletRespository.save({
                owner: owner,
                address: input.address.toLowerCase(),
            });
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to create wallet ${input.address}`, {
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

        const verifiedAddress = ethers.utils.verifyMessage(data.message, data.signature);
        if (address !== verifiedAddress.toLocaleLowerCase()) {
            throw new HttpException('signature verification failure', HttpStatus.BAD_REQUEST);
        }

        let wallet = await this.walletRespository.findOne({
            where: { address },
            relations: ['owner'],
        });

        // if wallet doesn't existed yet, create a new one and bind the owner on it
        if (!wallet) {
            wallet = { address, owner } as Wallet;
        } else {
            if (wallet.owner && wallet.owner.id) {
                throw new GraphQLError(`Wallet ${address} is already bound.`, {
                    extensions: { code: 'BAD_REQUEST' },
                });
            }
        }

        try {
            await this.walletRespository.save({ ...wallet, owner });
            return this.walletRespository.findOne({
                where: { address, owner },
                relations: ['owner'],
            });
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to bind wallet ${address}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
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
        let wallet = await this.walletRespository.findOne({
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
            return this.walletRespository.save({ ...wallet, owner: { id: this.unOwnedId } });
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
     * @param address The address to verify.
     * @param message The message that was signed.
     * @param signature The signature of the message.
     * @returns a Wallet object.
     */
    async verifyWallet(address: string, message: string, signature: string): Promise<Wallet | null> {
        if (ethers.utils.verifyMessage(message, signature).toLowerCase() === address.toLowerCase()) {
            await this.walletRespository.upsert([{ address }], {
                conflictPaths: ['address'],
                skipUpdateIfNoValuesChanged: true,
            });

            return this.walletRespository.findOneBy({ address });
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
     * @returns The `Minted` details + mint sale transactions associated with the given address.
     */
    async getMintedByAddress(address: string): Promise<Minted[]> {
        const wallet = await this.getWalletByAddress(address);
        if (!wallet) throw new Error(`Wallet with address ${address} doesn't exist.`);

        // FIXME: Need to setup pagination for this.
        const mintSaleTransactions = await this.mintSaleTransactionRepository.find({ where: { recipient: address } });

        const minted = await Promise.all(
            mintSaleTransactions.map(async (mintSaleTransaction) => {
                const { tierId, address } = mintSaleTransaction;

                const tier = await this.tierRepository
                    .createQueryBuilder('tier')
                    .leftJoinAndSelect('tier.collection', 'collection')
                    .leftJoinAndSelect('collection.collaboration', 'collaboration')
                    .where('collection.address = :address', { address })
                    .andWhere('tier.tierId = :tierId', { tierId })
                    .getOne();

                return { ...mintSaleTransaction, tier } as unknown as Minted;
            })
        );
        return minted;
    }

    /**
     *
     * The `Minted` list + `Deply` list
     *
     * @param address
     * @returns
     */
    async getActivitiesByAddress(address: string): Promise<any> {
        const wallet = await this.getWalletByAddress(address);
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
            address: tx.address,
            paymentToken: tx.paymentToken,
            price: tx.price,
            tokenId: tx.tokenId,
            tierId: tx.tierId,
        }));
        const deployList = deployedTransactions.map((tx) => ({
            type: 'Deploy',
            txTime: tx.txTime,
            address: tx.address,
            paymentToken: tx.paymentToken,
            price: tx.price,
            // tokenId: tx.tokenId,
            tierId: tx.tierId,
        }));
        const mergedList = [...(mintList || []), ...(deployList || [])].sort((item) => item.txTime * -1);

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

    async updateWallet(id: string, payload: Partial<Omit<UpdateWalletInput, 'id'>>): Promise<Wallet> {
        const wallet = await this.walletRespository.findOneBy({ id });
        if (!wallet) {
            throw new GraphQLError(`Wallet with id ${id} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        try {
            return this.walletRespository.save({ ...wallet, ...payload });
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to update wallet ${id}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }
    /**
     *
     * @param address
     * @returns
     */
    async getEstimatesByAddress(address: string): Promise<EstimatedValue[]> {
        const values: EstimatedValue[] = [];
        const wallet = await this.getWalletByAddress(address);
        if (!wallet) throw new Error(`Wallet with address ${address} doesn't exist.`);

        const priceTokenGroups = await this.getValueGroupByToken(address);

        for (const group of priceTokenGroups) {
            const coin = await this.coinService.getCoinByAddress(group.token);
            const usdcValue = coin?.derivedUSDC || '0';
            const price = group?.price || '0';

            values.push({
                paymentTokenAddress: group.token,
                total: price,
                totalUSDC: new BigNumber(price).multipliedBy(usdcValue).toString(),
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
}
