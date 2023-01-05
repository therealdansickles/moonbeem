import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from '../services/api.service';

@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get('/health')
    getHealth(): string {
        return this.appService.getHealth();
    }

    @Get('/tx_status/:chain/:txHash')
    async getTxStatus(@Param('chain') chain: string, @Param('txHash') txHash: string): Promise<boolean> {
        return await this.appService.getTxStatus(chain, txHash);
    }
}
