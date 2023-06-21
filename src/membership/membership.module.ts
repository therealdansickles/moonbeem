import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Membership } from './membership.entity';
import { MembershipService } from './membership.service';
import { MembershipResolver } from './membership.resolver';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationService } from '../organization/organization.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';

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
