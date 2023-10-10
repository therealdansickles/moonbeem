import { AddressWebhookParams, Alchemy, AlchemySettings, GetBaseNftsForOwnerOptions, Network, NftWebhookParams, WebhookType } from 'alchemy-sdk';
import { Interface, InterfaceAbi } from 'ethers';
import { get, isString } from 'lodash';
import { Repository } from 'typeorm';
import { URL } from 'url';

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { captureException } from '@sentry/node';

import { CollectionService } from '../collection/collection.service';
import * as VibeFactoryAbi from '../lib/abi/VibeFactory.json';
import { MaasService } from '../maas/maas.service';
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

@Injectable()
export class AlchemyService {
    private alchemy: { [key: string]: Alchemy } = {};
    private domain: string;
    private apiKey: string;
    private authToken: string;

    constructor(
        private configService: ConfigService,
        @InjectRepository(AlchemyWebhook)
        private readonly alchemyWebhookRepository: Repository<AlchemyWebhook>,
        @Inject(forwardRef(() => CollectionService))
        private collectionService: CollectionService,
        private mintSaleContractService: MintSaleContractService,
        private tierService: TierService,
        private maasService: MaasService,
    ) {
        this.apiKey = this.configService.get<string>('ALCHEMY_API_KEY');
        this.authToken = this.configService.get<string>('ALCHEMY_AUTH_TOKEN');
        this.domain = this.configService.get<string>('ALCHEMY_DOMAIN');
        const baseSetting: Partial<AlchemySettings> = { apiKey: this.apiKey, authToken: this.authToken };
        this.alchemy[Network.ARB_MAINNET] = new Alchemy({ network: Network.ARB_MAINNET, ...baseSetting });
        this.alchemy[Network.ARB_GOERLI] = new Alchemy({ network: Network.ARB_GOERLI, ...baseSetting });

        this.alchemy[Network.ETH_MAINNET] = new Alchemy({ network: Network.ETH_MAINNET, ...baseSetting });
        this.alchemy[Network.ETH_GOERLI] = new Alchemy({ network: Network.ETH_GOERLI, ...baseSetting });
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

    async getNFTsForCollection(network: Network, tokenAddress: string) {
        const res = await this._getNFTsForCollection(network, tokenAddress, { omitMetadata: true });
        return res.map((nft) => BigInt(nft.id.tokenId).toString());
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

    async createLocalWebhook(network: Network, type: WebhookType, address: string, alchemyId?: string) {
        await this.alchemyWebhookRepository.upsert({ network, type, address, alchemyId }, ['address']);
        return this.alchemyWebhookRepository.findOneBy({ network, type, address });
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
                const { args } = this._parseTransaction(VibeFactoryAbi, transaction.data);

                if (args && args[2] && isString(args[2])) {
                    const collectionId = new URL(args[2]).pathname.replace(/\//gi, '');
                    result.push({ network, tokenAddress, contractAddress, collectionId });
                }
            }
        } catch (err) {
            console.error(err.message, err.stack);
            captureException(err);
        }
        return result;
    }
}
