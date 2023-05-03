import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserWalletModule } from '../modules/user.wallet.module';
import { PassportModule } from '@nestjs/passport';
import { JWTModule } from '../modules/jwt.module';
import { SharedModule } from '../modules/share.module';
import { AuthResolver } from './auth.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { Membership } from '../membership/membership.entity';
import { MembershipModule } from '../membership/membership.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User, Wallet, Membership]),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
        forwardRef(() => MembershipModule),
        SharedModule,
        UserWalletModule,
        PassportModule,
        JWTModule,
    ],
    providers: [AuthService, AuthResolver],
    controllers: [AuthController],
    exports: [],
})
export class AuthModule {}
