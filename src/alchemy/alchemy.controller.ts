import { WebhookType } from 'alchemy-sdk';
import { Request } from 'express';

import { Controller, InternalServerErrorException, Logger, Post, Req } from '@nestjs/common';
import * as Sentry from '@sentry/node';

import { CollectionService } from '../collection/collection.service';
import { MaasService } from '../maas/maas.service';
import { NftService } from '../nft/nft.service';
import { Public } from '../session/session.decorator';
import { TierService } from '../tier/tier.service';
import { AlchemyService, EventType } from './alchemy.service';

@Controller({
    path: 'alchemy',
    version: '1',
})
export class AlchemyController {
    constructor(
        private readonly alchemyService: AlchemyService,
        private readonly collectionService: CollectionService,
        private readonly tierService: TierService,
        private readonly nftService: NftService,
        private readonly maasService: MaasService,
    ) {}

    private readonly logger = new Logger(AlchemyController.name);

    @Public()
    @Post('/webhook/nft-activity')
    public async nftActivity(@Req() req: Request) {
        this.logger.log('receive nft activity', JSON.stringify(req.body));
        if (req.body.type !== 'NFT_ACTIVITY') return;
        const nfts = await this.alchemyService.serializeNftActivityEvent(req.body);
        try {
            for (const nft of nfts) {
                const { collectionId, tierId, tokenId, properties, eventType } = nft;
                switch (eventType) {
                    case EventType.MINT: {
                        await this.nftService.createOrUpdateNftByTokenId({ collectionId, tierId, tokenId, properties });
                        break;
                    }
                    case EventType.TRANSFER: {
                        const tierInfo = await this.tierService.getTier({ id: tierId });
                        await this.maasService.handleLoyaltyPointsTransfer({ collectionId, tokenId, metadata: tierInfo.metadata });
                        break;
                    }
                }
            }
            return 'ok';
        } catch (err) {
            Sentry.captureException(err);
            throw new InternalServerErrorException(err);
        }
    }

    @Public()
    @Post('/webhook/address-activity')
    public async addressActivity(@Req() req: Request) {
        this.logger.log('receive address activity', JSON.stringify(req.body));
        if (req.body.type !== 'ADDRESS_ACTIVITY') return;
        const events = await this.alchemyService.serializeAddressActivityEvent(req.body);
        try {
            for (const event of events) {
                const { network, tokenAddress, contractAddress, collectionId } = event;
                const collection = await this.collectionService.getCollection(collectionId);
                await this.collectionService.updateCollection(collection.id, { tokenAddress, address: contractAddress });
                const res = await this.alchemyService.createWebhook(network, WebhookType.NFT_ACTIVITY, tokenAddress);
                await this.alchemyService.createLocalWebhook(network, WebhookType.NFT_ACTIVITY, tokenAddress, res.id);
            }
            return 'ok';
        } catch (err) {
            Sentry.captureException(err);
            throw new InternalServerErrorException(err);
        }
    }
}
