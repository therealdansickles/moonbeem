import { Module } from '@nestjs/common';
import { ReferralResolver } from './referral.resolver';
import { ReferralService } from './referral.service';
import { Referral } from './referral.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Referral])],
    exports: [ReferralModule],
    providers: [
        ReferralResolver,
        ReferralService
    ],
})
export class ReferralModule {
}
