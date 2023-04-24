import { Module } from '@nestjs/common';
import { SharedModule } from '../modules/share.module';
import { SearchResolver } from './search.resolver';
import { SearchService } from './search.service';

@Module({
    imports: [SharedModule],
    providers: [SearchService, SearchResolver],
    exports: [],
})
export class SearchModule {}
