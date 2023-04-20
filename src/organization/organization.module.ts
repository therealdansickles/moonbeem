import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Membership } from '../membership/membership.entity';
import { MembershipModule } from '../membership/membership.module';
import { Organization } from './organization.entity';
import { OrganizationResolver } from './organization.resolver';
import { OrganizationService } from './organization.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Membership,
            Organization,
        ]),
        forwardRef(()=> MembershipModule),
    ],
    exports: [OrganizationModule],
    providers: [OrganizationService, OrganizationResolver],
    controllers: [],
})
export class OrganizationModule {}
