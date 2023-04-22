import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from '../membership/membership.entity';
import { MembershipModule } from '../membership/membership.module';
import { Organization } from './organization.entity';
import { OrganizationResolver } from './organization.resolver';
import { OrganizationService } from './organization.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Membership,
            Organization,
            User,
        ]),
        forwardRef(()=> MembershipModule),
        forwardRef(()=> UserModule),
    ],
    exports: [OrganizationModule],
    providers: [OrganizationService, OrganizationResolver],
    controllers: [],
})
export class OrganizationModule {}
