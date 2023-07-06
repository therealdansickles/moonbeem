import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CollectionModule } from '../collection/collection.module';
import { TierModule } from '../tier/tier.module';
import { Plugin } from './plugin.entity';
import { PluginService } from './plugin.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plugin]),
        forwardRef(() => CollectionModule),
        forwardRef(() => TierModule),
    ],
    providers: [PluginService],
})
export class PluginModule {}
