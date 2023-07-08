import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AlchemyService } from './alchemy.service'

@Module({
    imports: [HttpModule],
    providers: [AlchemyService],
})
export class AlchemyModule { }
