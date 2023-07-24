import { forwardRef, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';
import { Relationship } from './relationship.entity';
import { RelationshipResolver } from './relationship.resolver';
import { RelationshipService } from './relationship.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Relationship]),
        forwardRef(() => WalletModule),
        forwardRef(() => UserModule),
        JwtModule,
    ],
    exports: [RelationshipModule],
    providers: [JwtService, RelationshipService, RelationshipResolver],
})
export class RelationshipModule {}
