import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Membership } from '../membership/membership.entity';
import { MembershipModule } from '../membership/membership.module';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { UserResolver } from './user.resolver';
import { MembershipService } from 'src/membership/membership.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Wallet, Membership, Organization]),
        forwardRef(() => WalletModule),
        forwardRef(() => MembershipModule),
        forwardRef(() => OrganizationModule),
    ],
    exports: [UserService],
    providers: [UserService, UserResolver],
})
export class UserModule {}
