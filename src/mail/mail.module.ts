import { Module } from '@nestjs/common';
import { MailgunModule } from '@nextnm/nestjs-mailgun';
import { MailService } from './mail.service';

import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config(); // FIXME: Use Nest.js config

@Module({
    imports: [
        MailgunModule.forRoot({
            username: process.env.MAILGUN_USERNAME || 'vibe',
            key: process.env.MAILGUN_API_KEY || 'vibe',
        }),
    ],
    providers: [MailService],
    exports: [MailService],
})
export class MailModule {}
