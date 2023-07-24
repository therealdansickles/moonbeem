import { Alchemy, Network } from 'alchemy-sdk';
import { get } from 'lodash';

import { Injectable } from '@nestjs/common';

import { alchemyConfig } from '../lib/configs/alchemy.config';

@Injectable()
export class AlchemyService {
    private alchemy = {};

    constructor() {
        const apiKey = alchemyConfig.apiKey;
        this.alchemy[Network.ARB_MAINNET] = new Alchemy({ apiKey, network: Network.ARB_MAINNET });
        this.alchemy[Network.ARB_GOERLI] = new Alchemy({ apiKey, network: Network.ARB_GOERLI });
    }

    private async _getNFTsForCollection(network: Network, address: string) {
        const { nfts } = await this.alchemy[network].getNFTsForCollection(address);
        return nfts;
    }

    async getNFTsForCollection(network: Network, address: string) {
        const res = await this._getNFTsForCollection(network, address);
        return res.map(nft => BigInt(nft.id.tokenId).toString());
    }

    getTokenIdFromNFTActivity(req: any) {
        return get(req, 'event.activity', []).reduce((accu, activity) => {
            const rawTokenId = get(activity, 'tokenId');
            // unexpected tokenId
            if (!rawTokenId) return accu;
            const tokenId = BigInt(rawTokenId).toString();
            // deduplication
            if (accu.indexOf(tokenId) >= 0) return accu;
            accu.push(tokenId);
            return accu;
        }, []);
    }
}