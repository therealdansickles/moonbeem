import { Module } from '@nestjs/common';
import { MailgunModule } from '@nextnm/nestjs-mailgun';
import { mailgunConfig } from '../lib/configs/mailgun.config';
import { MailService } from './mail.service';

@Module({
    imports: [
        MailgunModule.forRoot({
            username: mailgunConfig.USERNAME,
            key: mailgunConfig.KEY,
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
