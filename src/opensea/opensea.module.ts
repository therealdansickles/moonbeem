import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { OpenseaService } from './opensea.service';

@Module({
    imports: [HttpModule],
    providers: [OpenseaService],
})
export class OpenseaModule {}
