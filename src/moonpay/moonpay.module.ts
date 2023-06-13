import { Module } from '@nestjs/common';
import { MoonpayResolver } from './moonpay.resolver';
import { MoonpayService } from './moonpay.service';

@Module({
    providers: [MoonpayResolver, MoonpayService],
    exports: [MoonpayService],
})
export class MoonpayModule {}
