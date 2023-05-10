import { Module } from '@nestjs/common';
import { FactoryResolver } from './factory.resolver';
import { FactoryService } from './factory.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factory } from './factory.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Factory], 'sync_chain')],
    exports: [FactoryModule, FactoryService],
    providers: [FactoryService, FactoryResolver],
    controllers: [],
})
export class FactoryModule {}
