import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collaboration } from './collaboration.entity';
import { CollaborationService } from './collaboration.service';
import { CollaborationResolver } from './collaboration.resolver';
import { Collection } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Collaboration, Collection, Wallet]),
        forwardRef(() => WalletModule),
        forwardRef(() => CollectionModule),
    ],
    providers: [CollaborationService, CollaborationResolver],
    controllers: [],
    exports: [],
})
export class CollaborationModule {}
