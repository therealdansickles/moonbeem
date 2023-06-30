import { Module, forwardRef } from '@nestjs/common';
import { SaleHistoryService } from './saleHistory.service';
import { SaleHistoryResolver } from './saleHistory.resolver';
import { HttpModule } from '@nestjs/axios';
import { OpenseaService } from '../opensea/opensea.service';
import { OpenseaModule } from '../opensea/opensea.module';

@Module({
    imports: [HttpModule, forwardRef(() => OpenseaModule)],
    providers: [OpenseaService, SaleHistoryResolver, SaleHistoryService],
    exports: [SaleHistoryModule],
})
export class SaleHistoryModule {}
