import { Module } from '@nestjs/common';
import { SharedModule } from './share.module';
import { SearchResolver } from '../resolvers/search.resolver';
import { SearchController } from '../controllers/search.controller';
import { SearchService } from '../services/search.service';

@Module({
    imports: [SharedModule],
    providers: [SearchService, SearchResolver],
    controllers: [SearchController],
    exports: [],
})
export class SearchModule {}
