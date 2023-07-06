import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { Plugin } from './plugin.entity';
import { PluginService } from './plugin.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plugin]),
        forwardRef(() => CollectionModule),
        forwardRef(() => TierModule),
    ],
    providers: [PluginService, TierService, CollectionService],
})
export class PluginModule {}
