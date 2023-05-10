import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { History721 } from './history721.entity';
import { History721Resolver } from './history721.resolver';
import { History721Service } from './history721.service';

@Module({
    imports: [TypeOrmModule.forFeature([History721], 'sync_chain')],
    exports: [History721Module],
    providers: [History721Service, History721Resolver],
})
export class History721Module {}
