import { forwardRef, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MailModule } from '../mail/mail.module';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationService } from '../organization/organization.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Membership } from './membership.entity';
import { MembershipResolver } from './membership.resolver';
import { MembershipService } from './membership.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Membership, Organization, User]),
        forwardRef(() => OrganizationModule),
        forwardRef(() => UserModule),
        forwardRef(() => MailModule),
        JwtModule
    ],
    exports: [MembershipModule, MembershipService],
    providers: [JwtService, MembershipService, MembershipResolver, OrganizationService],
    controllers: [],
})
export class MembershipModule {}
