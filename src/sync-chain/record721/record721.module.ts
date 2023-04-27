import { Module } from '@nestjs/common';
import { Record721 } from './record721.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Record721Service } from './record721.service';
import { Record721Resolver } from './record721.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([Record721], 'sync_chain')],
    exports: [Record721Module],
    providers: [Record721Service, Record721Resolver],
})
export class Record721Module {}
