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
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Collection, Organization, Tier]),
        TypeOrmModule.forFeature([MintSaleContract], 'sync_chain'),
        forwardRef(() => CollaborationModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => TierModule),
        forwardRef(() => MintSaleContractModule),
    ],
    exports: [CollectionModule, CollectionService],
    providers: [CollectionService, CollectionResolver],
    controllers: [],
})
export class CollectionModule {}
