import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { Collection } from './collection.entity';
import { CollectionService } from './collection.service';
import { CollectionResolver } from './collection.resolver';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Collection, Organization, Tier]),
        forwardRef(() => CollaborationModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => TierModule),
    ],
    exports: [CollectionModule],
    providers: [CollectionService, CollectionResolver, TierService],
    controllers: [],
})
export class CollectionModule {}
