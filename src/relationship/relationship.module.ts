import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletModule } from '../wallet/wallet.module';
import { Relationship } from './relationship.entity';
import { RelationshipService } from './relationship.service';
import { RelationshipResolver } from './relationship.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([Relationship]), forwardRef(() => WalletModule)],
    exports: [RelationshipModule],
    providers: [RelationshipService, RelationshipResolver],
})
export class RelationshipModule {}
