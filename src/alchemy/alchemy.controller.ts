import { WebhookType } from 'alchemy-sdk';
import { Request } from 'express';

import { Controller, Post, Req } from '@nestjs/common';

import { CollectionService } from '../collection/collection.service';
import { Public } from '../session/session.decorator';
import { AlchemyService } from './alchemy.service';

@Controller({
    path: 'alchemy',
    version: '1',
})
export class AlchemyController {
    constructor(private readonly alchemyService: AlchemyService, private readonly collectionService: CollectionService) {}

    @Public()
    @Post('/webhook/nft-activity')
    public async nftActivity(@Req() req: Request) {
        if (req.body.type !== 'NFT_ACTIVITY') return;
        const nfts = await this.alchemyService.serializeNftActivityEvent(req.body);
        return nfts;
    }

    @Public()
    @Post('/webhook/address-activity')
    public async addressActivity(@Req() req: Request) {
        if (req.body.type !== 'ADDRESS_ACTIVITY') return;
        const events = await this.alchemyService.serializeAddressActivityEvent(req.body);
        for (const event of events) {
            const { network, tokenAddress, contractAddress, collectionId } = event;
            const collection = await this.collectionService.getCollection(collectionId);
            await this.collectionService.updateCollection(collection.id, { tokenAddress, address: contractAddress });
            await this.alchemyService.createWebhook(network, WebhookType.NFT_ACTIVITY, tokenAddress);
        }
        return 'ok';
    }
}
