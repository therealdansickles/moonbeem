import { Alchemy, AlchemySettings, GetBaseNftsForOwnerOptions, Network, WebhookType } from 'alchemy-sdk';
import { get } from 'lodash';
import { URL } from 'url';

import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CollectionService } from '../collection/collection.service';
import { alchemyConfig } from '../lib/configs/alchemy.config';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { TierService } from '../tier/tier.service';

function sleep(duration) {
    return new Promise(resolve => setTimeout(resolve, duration));
}

export enum EventType {
    MINT = 'mint',
    TRANSFER = 'transfer',
    BURN = 'burn',
    UNKNOWN = 'unknown'
}

@Injectable()
export class AlchemyService {
    private alchemy: { [key: string]: Alchemy } = {};
    
    constructor(
        private configService: ConfigService,
        @Inject(forwardRef(() => CollectionService))
        private collectionService: CollectionService,
        private mintSaleContractService: MintSaleContractService,
        private tierService: TierService,
    ) {
        const apiKey = alchemyConfig.apiKey;
        const authToken = alchemyConfig.authToken;
        const baseSetting: Partial<AlchemySettings> = { apiKey, authToken };
        this.alchemy[Network.ARB_MAINNET] = new Alchemy({ network: Network.ARB_MAINNET, ...baseSetting });
        this.alchemy[Network.ARB_GOERLI] = new Alchemy({ network: Network.ARB_GOERLI, ...baseSetting });
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
        return res.map(nft => BigInt(nft.id.tokenId).toString());
    }

    private async _createWebhook(network: Network, tokenAddress: string) {
        const domain = this.configService.get('ALCHEMY_DOMAIN');
        if (!domain || !this.configService.get('ALCHEMY_API_KEY') || !this.configService.get('ALCHEMY_AUTH_TOKEN'))
            return;
        const url = '/v1/webhook/nft-activity';
        return await this.alchemy[network].notify.createWebhook(
            new URL(url, domain).href,
            WebhookType.NFT_ACTIVITY,
            {
                filters: [{
                    contractAddress: tokenAddress
                }],
                network,
            }
        );
    }

    async createWebhook(network: Network, tokenAddress: string) {
        return this._createWebhook(network, tokenAddress); 
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

    async serializeActivityEvent(req: any) {
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
            });
        }
        return result;
    }
}
