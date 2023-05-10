import { Module, forwardRef } from '@nestjs/common';
import { SharedModule } from '../modules/share.module';
import { SearchResolver } from './search.resolver';

import { SearchService } from './search.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from '../collection/collection.entity';
import { User } from '../user/user.entity';
import { CollectionModule } from '../collection/collection.module';
import { UserModule } from '../user/user.module';
import { WalletModule } from '../wallet/wallet.module';
import { Wallet } from '../wallet/wallet.entity';

@Module({
    imports: [
        SharedModule,
        TypeOrmModule.forFeature([Collection, User, Wallet]),
        forwardRef(() => CollectionModule),
        forwardRef(() => UserModule),
        forwardRef(() => WalletModule),
    ],
    providers: [SearchService, SearchResolver],
    exports: [SearchModule],
})
export class SearchModule {}
