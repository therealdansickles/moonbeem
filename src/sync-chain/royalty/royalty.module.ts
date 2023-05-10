import { Module } from '@nestjs/common';
import { RoyaltyResolver } from './royalty.resolver';
import { RoyaltyService } from './royalty.service';
import { Royalty } from './royalty.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports: [TypeOrmModule.forFeature([Royalty], 'sync_chain')],
    exports: [RoyaltyModule],
    providers: [RoyaltyService, RoyaltyResolver],
})
export class RoyaltyModule {}
