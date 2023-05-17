import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

import { SessionService } from './session.service';
import { User } from '../user/user.entity';
import { Wallet } from '../wallet/wallet.entity';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';
import { SessionResolver } from './session.resolver';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, User]),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
        JwtModule.register({
            secret: process.env.SESSION_SECRET,
            signOptions: { expiresIn: '1d' },
        }),
        SessionModule,
    ],
    providers: [SessionService, SessionResolver],
    exports: [SessionModule, SessionResolver],
})
export class SessionModule {}
