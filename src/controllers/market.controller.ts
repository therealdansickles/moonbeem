import { Controller, Get, Param } from '@nestjs/common';
import { AddressHoldingReqDto } from 'src/lib/interfaces/market.interface';
import { MarketService } from 'src/services/market.service';

@Controller({
    path: 'market',
    version: '1',
})
export class MarketController {
    constructor(private readonly marketService: MarketService) {}

    @Get('/get_address_holdings/:address')
    getAddressHoldings(@Param() params: AddressHoldingReqDto) {
        return this.marketService.getAddressHoldings(params.address);
    }
}
