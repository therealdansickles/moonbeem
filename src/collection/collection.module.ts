import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { Collection } from './collection.entity';
import { CollectionService } from './collection.service';
import { CollectionResolver } from './collection.resolver';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Collection, Tier]),
        forwardRef(() => CollaborationModule),
        forwardRef(() => TierModule),
    ],
    exports: [CollectionModule],
    providers: [CollectionService, CollectionResolver],
    controllers: [],
})
export class CollectionModule {}
