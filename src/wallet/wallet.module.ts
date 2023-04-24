import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './wallet.entity';
import { WalletService } from './wallet.service';
import { WalletResolver } from './wallet.resolver';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Wallet, User, Collaboration]),
        forwardRef(() => UserModule),
        forwardRef(() => CollaborationModule),
    ],
    exports: [WalletModule],
    providers: [WalletService, WalletResolver],
    controllers: [],
})
export class WalletModule {}
