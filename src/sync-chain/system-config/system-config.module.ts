import { Module } from '@nestjs/common';
import { SystemConfig } from './system-config.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemConfigService } from './system-config.service';
import { SystemConfigResolver } from './system-config.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([SystemConfig], 'sync_chain')],
    exports: [SystemConfigModule],
    providers: [SystemConfigService, SystemConfigResolver],
})
export class SystemConfigModule {}
