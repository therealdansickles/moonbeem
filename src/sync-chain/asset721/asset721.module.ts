import { Module } from '@nestjs/common';
import { Asset721 } from './asset721.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset721Service } from './asset721.service';
import { Asset721Resolver } from './asset721.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([Asset721], 'sync_chain')],
    exports: [Asset721Module],
    providers: [Asset721Service, Asset721Resolver],
})
export class Asset721Module {}
