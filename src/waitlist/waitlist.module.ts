import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Waitlist } from './waitlist.entity';
import { WaitlistService } from './waitlist.service';
import { WaitlistResolver } from './waitlist.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([Waitlist])],
    exports: [WaitlistModule],
    providers: [WaitlistService, WaitlistResolver],
})
export class WaitlistModule {}
