import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from './collaboration.entity';
import { CollaborationService } from './collaboration.service';
import { CollaborationResolver } from './collaboration.resolver';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { WalletResolver } from '../wallet/wallet.resolver';
import { WalletService } from '../wallet/wallet.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Collection, Wallet]),
        forwardRef(() => WalletModule),
        forwardRef(() => CollectionModule),
    ],
    providers: [CollaborationService, CollaborationResolver, WalletService, WalletResolver],
    controllers: [],
    exports: [],
})
export class CollaborationModule {}
