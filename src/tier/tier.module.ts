import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Tier } from './tier.entity';
import { TierService } from './tier.service';
import { TierResolver } from './tier.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([Collection, Tier]), forwardRef(() => CollectionModule)],
    exports: [TierModule],
    providers: [TierService, TierResolver],
})
export class TierModule {}
