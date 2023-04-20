import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './wallet.entity';
import { WalletService } from './wallet.service';
import { WalletResolver } from './wallet.resolver';
import { Collaboration } from '../collaboration/collaboration.entity';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { CollaborationService } from '../collaboration/collaboration.service';
import { CollaborationResolver } from '../collaboration/collaboration.resolver';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';

@Module({
    imports: [TypeOrmModule.forFeature([Wallet, Collaboration, User]), forwardRef(() => CollaborationModule), forwardRef(() => UserModule)],
    exports: [WalletModule],
    providers: [WalletService, WalletResolver, CollaborationService, CollaborationResolver],
    controllers: [],
})
export class WalletModule {}
