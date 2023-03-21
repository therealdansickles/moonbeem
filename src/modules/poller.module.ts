import { Module } from '@nestjs/common';
import { PollerService } from '../services/poller.service';
import { SharedModule } from './share.module';

@Module({
    imports: [SharedModule],
    controllers: [],
    providers: [PollerService],
    exports: [PollerService],
})
export class PollerModule {}
