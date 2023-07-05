import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Plugin } from './plugin.entity';
import { PluginService } from './plugin.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Plugin]),
    ],
    providers: [PluginService],
})
export class PluginModule {}
