import { Request } from 'express';

import { Controller, Post, Req } from '@nestjs/common';

import { Public } from '../session/session.decorator';
import { AlchemyService } from './alchemy.service';

@Controller({
    path: 'alchemy',
    version: '1',
})
export class AlchemyController {
    constructor(private readonly alchemyService: AlchemyService) {}

    @Public()
    @Post('/webhook/nft-activity')
    public async nftActivity(@Req() req: Request) {
        const nfts = await this.alchemyService.serializeActivityEvent(req.body);
        return nfts;
    }
}
