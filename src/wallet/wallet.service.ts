import { Injectable } from '@nestjs/common';
// import { Wallet as WalletModel, Prisma } from '@prisma/client';
import { BindWalletInput, CreateWalletInput } from './wallet.dto';
import { Wallet } from './wallet.entity';
import { GraphQLError } from 'graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../user/user.entity';

@Injectable()
export class WalletService {
    constructor(
        @InjectRepository(Wallet) private walletRespository: Repository<Wallet>,
        @InjectRepository(User) private userRepository: Repository<User>
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
        return this.walletRespository.findOneBy({ address });
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
                if (!owner) throw new Error(`User with id ${input.ownerId} doesn't exist.`);
            }

            return this.walletRespository.save({
                address: input.address,
                owner: owner,
            });
        } catch (e) {
            throw new GraphQLError(e.message);
        }
    }

    /**
     * Changes the owner of the wallet to the provided user id.
     * If the wallet doesn't exist, it will be created.
     *
     * @param data The data to use when binding a wallet.
     * @returns The wallet that was bound to the user.
     */
    //async bindWallet(data: BindWalletInput): Promise<Wallet> {
    //const { address, ownerId } = data;
    //const wallet = await this.walletRespository.findOneBy({ address, owner: { id: this.unOwnedId } });
    //if (!wallet) throw new Error("Wallet doesn't exist.");
    //return this.walletRespository.save({ ...wallet, ownerId: ownerId });
    //}

    /**
     * Unbinds the wallet for the given address.
     * If the wallet doesn't exist, it will be created.
     *
     * @param data The data to use when unbinding a wallet.
     * @returns The wallet that was bound to the user.
     */
    //async unbindWallet(data: BindWalletInput): Promise<Wallet> {
    //const { address, ownerId } = data;
    //const wallet = await this.walletRespository.findOneBy({ address, owner: { id: this.unOwnedId } });
    //if (!wallet) throw new Error("Wallet doesn't exist.");
    //return this.walletRespository.save({ ...wallet, ownerId: this.unOwnedId });
    //}

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
            throw new GraphQLError(`address ${eip3770Address} is not a valid ethereum or EIP-3770 address`);
        }

        return { address };
    }
}
