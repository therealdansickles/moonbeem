import {
    AddressWebhookParams,
    Alchemy,
    AlchemySettings,
    GetBaseNftsForOwnerOptions,
    GetNftsForOwnerOptions,
    Network,
    Nft,
    NftContract,
    NftWebhookParams,
    WebhookType,
} from 'alchemy-sdk';
import { Contract, Interface, InterfaceAbi, JsonRpcProvider } from 'ethers';
import { get, isNil, isString, omitBy } from 'lodash';
import { Repository } from 'typeorm';
import { URL } from 'url';

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { captureException } from '@sentry/node';

import { CollectionService } from '../collection/collection.service';
import * as VibeFactoryAbi from '../lib/abi/VibeFactory.json';
import * as VibeFactoryERC6551Abi from '../lib/abi/VibeFactory-withERC6551.json';
import * as ownableAbi from '../lib/abi/Ownable.json';
import { MetadataProperties } from '../metadata/metadata.dto';
import { NftService } from '../nft/nft.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { TierService } from '../tier/tier.service';
import { AlchemyWebhook } from './alchemy-webhook.entity';

function sleep(duration) {
    return new Promise((resolve) => setTimeout(resolve, duration));
}

export enum EventType {
    MINT = 'mint',
    TRANSFER = 'transfer',
    BURN = 'burn',
    UNKNOWN = 'unknown',
}

export const chainIdToNetwork = {
    1: Network.ETH_MAINNET,
    5: Network.ETH_GOERLI,
    42161: Network.ARB_MAINNET,
    421613: Network.ARB_GOERLI,
    421614: Network.ARB_SEPOLIA,
    11155111: Network.ETH_SEPOLIA,
};

@Injectable()
export class AlchemyService {
    private alchemy: { [key: string]: Alchemy } = {};
    private domain: string;
    private apiKey: string;
    private authToken: string;

    constructor(
        @InjectRepository(AlchemyWebhook)
        private readonly alchemyWebhookRepository: Repository<AlchemyWebhook>,
        @Inject(forwardRef(() => CollectionService))
        private collectionService: CollectionService,
        private mintSaleContractService: MintSaleContractService,
        private tierService: TierService,
        private configService: ConfigService,
        private nftService: NftService,
    ) {
        this.apiKey = this.configService.get<string>('ALCHEMY_API_KEY');
        this.authToken = this.configService.get<string>('ALCHEMY_AUTH_TOKEN');
        this.domain = this.configService.get<string>('ALCHEMY_DOMAIN');
        const baseSetting: Partial<AlchemySettings> = { apiKey: this.apiKey, authToken: this.authToken };
        this.alchemy[Network.ARB_MAINNET] = new Alchemy({ network: Network.ARB_MAINNET, ...baseSetting });
        this.alchemy[Network.ARB_GOERLI] = new Alchemy({ network: Network.ARB_GOERLI, ...baseSetting });
        this.alchemy[Network.ARB_SEPOLIA] = new Alchemy({ network: Network.ARB_SEPOLIA, ...baseSetting });
        this.alchemy[Network.ETH_MAINNET] = new Alchemy({ network: Network.ETH_MAINNET, ...baseSetting });
        this.alchemy[Network.ETH_GOERLI] = new Alchemy({ network: Network.ETH_GOERLI, ...baseSetting });
        this.alchemy[Network.ETH_SEPOLIA] = new Alchemy({ network: Network.ETH_SEPOLIA, ...baseSetting });
    }

    async onModuleInit() {
        await this.initializeFactoryContractWebhooks();
    }

    private async _getNFTsForCollection(network: Network, tokenAddress: string, options?: GetBaseNftsForOwnerOptions) {
        const nfts = [];
        for await (const nft of this.alchemy[network].nft.getNftsForContractIterator(tokenAddress, options)) {
            // response structure could be found here: https://docs.alchemy.com/reference/sdk-getnftsforcontractiterator
            nfts.push(nft);
            // ~ QPS 20
            await sleep(50);
        }
        return nfts;
    }

    async getNFTCollectionMetadata(chainId: number, tokenAddress: string): Promise<NftContract> {
        const network = chainIdToNetwork[chainId];
        return this.alchemy[network].nft.getContractMetadata(tokenAddress);
    }

    async getNFTsForCollection(network: Network, tokenAddress: string) {
        const res = await this._getNFTsForCollection(network, tokenAddress, { omitMetadata: true });
        return res.map((nft) => BigInt(nft.id.tokenId).toString());
    }

    async syncNFTsForCollection(chainId: number, tokenAddress: string, collectionId: string, tierId: string, options?: GetBaseNftsForOwnerOptions) {
        const network = chainIdToNetwork[chainId];
        const iterator = this.alchemy[network].nft.getNftsForContractIterator(tokenAddress, options);
        for await (const nft of iterator) {
            const {
                tokenId,
                image,
                raw: { metadata },
            }: Nft = nft;
            const response = await this.alchemy[network].nft.getOwnersForNft(tokenAddress, tokenId);
            const owner = response?.owners[0];
            const createNftInput = {
                collectionId,
                tierId,
                tokenId,
                image: image.originalUrl,
                ownerAddress: owner,
                properties: metadata,
            };
            await this.nftService.createOrUpdateNftByTokenId(createNftInput);
            await sleep(100);
        }
        return true;
    }

    convertAttributesToProperties(attributes: Record<string, any>[]): MetadataProperties {
        const properties = {};
        for (const attribute of attributes) {
            const { trait_type, value, display_type } = attribute;
            properties[trait_type] = omitBy(
                {
                    name: trait_type,
                    value,
                    type: display_type || 'string',
                },
                isNil,
            );
        }
        return properties;
    }

    async _getNftsForOwner(network: Network, owner: string, options?: GetNftsForOwnerOptions) {
        return this.alchemy[network].nft.getNftsForOwner(owner, options);
    }

    async getNftsForOwnerAddress(network: Network, ownerAddress: string) {
        return await this._getNftsForOwner(network, ownerAddress);
    }

    private async _getWebhooks(network: Network) {
        const res = await this.alchemy[network].notify.getAllWebhooks();
        if (res && res.webhooks) return res.webhooks;
        else return [];
    }

    async getWebhooks(network: Network, type?: WebhookType) {
        const webhooks = await this._getWebhooks(network);
        if (type) return webhooks.filter((webhook) => webhook.type === type && webhook.network === network);
        else return webhooks.filter((webhook) => webhook.network === network);
    }

    private async _createWebhook(network: Network, path: string, type, params) {
        if (!this.domain || !this.apiKey || !this.authToken) return;
        const url = new URL(path, this.domain).toString();
        return await this.alchemy[network].notify.createWebhook(url, type, params);
    }

    async createNftActivityWebhook(network: Network, address: string) {
        return this.createWebhook(network, WebhookType.NFT_ACTIVITY, address);
    }

    async createWebhook(network: Network, type: WebhookType, address: string) {
        let endpointUrl;
        let params;

        switch (type) {
            case WebhookType.NFT_ACTIVITY: {
                endpointUrl = '/v1/alchemy/webhook/nft-activity';
                params = {
                    filters: [
                        {
                            contractAddress: address,
                        },
                    ],
                    network,
                } as NftWebhookParams;
                break;
            }
            case WebhookType.ADDRESS_ACTIVITY: {
                endpointUrl = '/v1/alchemy/webhook/address-activity';
                params = {
                    addresses: [address],
                    network,
                } as AddressWebhookParams;
                break;
            }
            default: {
                throw Error(`Unsupported webhook type: ${type}`);
            }
        }

        return this._createWebhook(network, endpointUrl, type, params);
    }

    private async _updateWebhook(network: Network, id: string, params) {
        return this.alchemy[network].notify.updateWebhook(id, params);
    }

    async updateWebhook(network: Network, id: string, params) {
        return this._updateWebhook(network, id, params);
    }

    async createLocalWebhook(network: Network, type: WebhookType, address: string, alchemyId?: string) {
        await this.alchemyWebhookRepository.upsert({ network, type, address, alchemyId }, ['address']);
        return this.alchemyWebhookRepository.findOneBy({ network, type, address });
    }

    async getLocalWebhooks(network: Network, type: WebhookType, address?: string) {
        const query: any = { network, type };
        if (address) query.address = address;
        return this.alchemyWebhookRepository.findBy(query);
    }

    async initializeFactoryContractWebhooks() {
        for (const network of Object.values(Network)) {
            const configKey = 'ALCHEMY_FACTORY_CONTRACT_ADDRESS_' + network.replace('-', '_').toUpperCase();
            const configAddress = this.configService.get<string>(configKey);
            // if address is not configured, then we don't need to check the existance.
            if (!configAddress) continue;
            const existedWebhooks = await this.getWebhooks(network, WebhookType.ADDRESS_ACTIVITY);
            // all environments webhook are mixed, so we need to filter by domain again
            const isExisted = existedWebhooks.find((webhook) => webhook.url?.startsWith(this.domain));
            if (!isExisted) {
                const res = await this.createWebhook(network, WebhookType.ADDRESS_ACTIVITY, configAddress);
                res && (await this.createLocalWebhook(network, WebhookType.ADDRESS_ACTIVITY, configAddress, res.id));
            } else {
                const existedLocalWebhooks = await this.getLocalWebhooks(network, WebhookType.ADDRESS_ACTIVITY);
                const targetWebhook = existedLocalWebhooks.find((webhook) => webhook.address === configAddress);
                if (!targetWebhook) {
                    await this.updateWebhook(network, isExisted.id, { addAddresses: [configAddress] });
                    await this.createLocalWebhook(network, WebhookType.ADDRESS_ACTIVITY, configAddress, isExisted.id);
                }
            }
        }
    }

    getEventTypeByAddress(fromAddress: string, toAddress: string): string {
        // mint: fromAddress == 0 && toAddress != 0
        // burn: fromAddress != 0 && toAddress == 0
        // transfer: fromAddress != 0 && toAddress != 0
        const stringifyFromAddress = BigInt(fromAddress).toString();
        const stringifyToAddress = BigInt(toAddress).toString();
        if (stringifyFromAddress == '0' && stringifyToAddress != '0') {
            return EventType.MINT;
        } else if (stringifyFromAddress != '0' && stringifyToAddress != '0') {
            return EventType.TRANSFER;
        } else if (stringifyFromAddress != '0' && stringifyToAddress == '0') {
            return EventType.BURN;
        } else {
            return EventType.UNKNOWN;
        }
    }

    async serializeNftActivityEvent(req: any) {
        const result = [];
        for (const activity of get(req, 'event.activity', [])) {
            const { contractAddress, toAddress, fromAddress, erc721TokenId } = activity;
            // unexpected erc721TokenId
            if (!contractAddress || !toAddress || !fromAddress || !erc721TokenId) continue;
            const tokenId = BigInt(erc721TokenId).toString();
            const eventType = this.getEventTypeByAddress(fromAddress, toAddress);
            const collection = await this.collectionService.getCollectionByQuery({ tokenAddress: contractAddress });
            if (!collection) throw new Error(`Unknown collection ${contractAddress} from Alchemy webhook`);
            const contract = await this.mintSaleContractService.getMintSaleContractByCollection(collection.id, +tokenId);
            if (!contract) throw new Error(`Can't find corresponding contract with collection id ${collection.id}`);
            const tier = await this.tierService.getTier({ collection: { id: collection.id }, tierId: contract.tierId });
            // TODO: need to deduplication
            result.push({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                eventType,
                ownerAddress: toAddress,
                properties: tier.metadata?.properties || {},
            });
        }
        return result;
    }

    private async _getTransaction(network: Network, transactionHash: string) {
        return this.alchemy[network].transact.getTransaction(transactionHash);
    }

    private async _getLogs(network: Network, address: string, fromBlock: number, toBlock: number) {
        return this.alchemy[network].core.getLogs({
            address,
            fromBlock,
            toBlock,
        });
    }

    private _parseTransaction(abi: InterfaceAbi, data: string) {
        const iface = new Interface(abi);
        return iface.parseTransaction({ data });
    }

    async serializeAddressActivityEvent(req: any) {
        const network = get<string>(req, 'event.network', '').toLowerCase().replace('_', '-');
        const result = [];
        try {
            for (const activity of get(req, 'event.activity', [])) {
                const { hash: transactionHash, blockNum, toAddress: factoryAddress, asset, value } = activity;
                // do some simple filtering
                if (asset != 'ETH' || value != 0) continue;

                const block = parseInt(blockNum);
                const logs = await this._getLogs(network, factoryAddress, block, block);

                // another filtering
                if (logs.length != 2) continue;
                const [eventForCreateERC721, eventForMintSale] = logs;
                const tokenAddress = `0x${eventForCreateERC721?.topics[2]?.slice(-40)}`;
                const contractAddress = `0x${eventForMintSale?.topics[2]?.slice(-40)}`;

                const transaction = await this._getTransaction(network, transactionHash);
                // staging is using VibeFactoryERC6551Abi but production is using VibeFactoryAbi
                const isSepolia = network.includes('sepolia');
                const abi = isSepolia ? VibeFactoryERC6551Abi : VibeFactoryAbi;
                const { args } = this._parseTransaction(abi, transaction.data);
                if (isSepolia) {
                    if ((args && args[0] && args[0][2], isString(args[0][2]))) {
                        const collectionId = new URL(args[0][2]).pathname.replace(/\//gi, '');
                        result.push({ network, tokenAddress, contractAddress, collectionId });
                    }
                } else {
                    if (args && args[2] && isString(args[2])) {
                        const collectionId = new URL(args[2]).pathname.replace(/\//gi, '');
                        result.push({ network, tokenAddress, contractAddress, collectionId });
                    }
                }
            }
        } catch (err) {
            console.error(err.message, err.stack);
            captureException(err);
        }
        return result;
    }

    async getContractOwner(chainId: number, tokenAddress: string): Promise<string> {
        const network = chainIdToNetwork[chainId];
        const rpcUrl = `https://${network}.g.alchemy.com/v2/${this.apiKey}`;
        const provider = new JsonRpcProvider(rpcUrl);
        const contract = new Contract(tokenAddress, ownableAbi, provider);
        try {
            const owner = contract.owner();
            return owner;
        } catch (error) {
            console.error(error.message, error.stack);
            captureException(error);
            return '';
        }
    }
}
