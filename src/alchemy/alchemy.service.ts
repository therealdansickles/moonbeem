import { Alchemy, GetBaseNftsForOwnerOptions, Network } from 'alchemy-sdk';
import { get } from 'lodash';

import { Injectable } from '@nestjs/common';

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
    private alchemy = {};
    
    constructor(
        private collectionService: CollectionService,
        private mintSaleContractService: MintSaleContractService,
        private tierService: TierService,
    ) {
        const apiKey = alchemyConfig.apiKey;
        this.alchemy[Network.ARB_MAINNET] = new Alchemy({ apiKey, network: Network.ARB_MAINNET });
        this.alchemy[Network.ARB_GOERLI] = new Alchemy({ apiKey, network: Network.ARB_GOERLI });
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
