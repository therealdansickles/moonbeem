import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { CollectionModule } from '../collection/collection.module';
import { Membership } from '../membership/membership.entity';
import { MembershipService } from '../membership/membership.service';
import { MembershipModule } from '../membership/membership.module';
import { Organization } from './organization.entity';
import { OrganizationResolver } from './organization.resolver';
import { OrganizationService } from './organization.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { MailModule } from '../mail/mail.module';
import { Tier } from '../tier/tier.entity';
import { TierModule } from '../tier/tier.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collection, Membership, Organization, User,Tier]),
        forwardRef(() => MembershipModule),
        forwardRef(() => UserModule),
        forwardRef(() => CollectionModule),
        forwardRef(() => MailModule),
        forwardRef(() => TierModule),
    ],
    exports: [OrganizationModule],
    providers: [CollectionService, MembershipService, OrganizationService, OrganizationResolver],
    controllers: [],
})
export class OrganizationModule {}
