import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collaboration } from './collaboration.entity';
import { CollaborationResolver } from './collaboration.resolver';
import { CollaborationService } from './collaboration.service';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Collection, Organization, User, Wallet]),
        forwardRef(() => CollectionModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
    ],
    providers: [CollaborationService, CollaborationResolver],
    controllers: [],
    exports: [CollaborationModule, CollaborationService],
})
export class CollaborationModule {}
