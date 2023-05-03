import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { Membership } from '../membership/membership.entity';
import { MembershipModule } from '../membership/membership.module';
import { MembershipService } from 'src/membership/membership.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { User } from './user.entity';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Wallet, Membership, Organization, Collaboration]),
        forwardRef(() => CollaborationModule),
        forwardRef(() => MembershipModule),
        forwardRef(() => OrganizationModule),
        forwardRef(() => WalletModule),
    ],
    exports: [UserService],
    providers: [UserService, UserResolver],
})
export class UserModule {}
