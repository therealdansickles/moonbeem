import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MaasResolver } from './maas.resolver';
import { MaasService } from './maas.service';

@Module({
    imports: [ConfigModule, HttpModule],
    providers: [MaasService, MaasResolver],
})
export class MaasModule {}
