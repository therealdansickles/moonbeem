import { Injectable } from '@nestjs/common';
import { MailgunService, EmailOptions } from '@nextnm/nestjs-mailgun';
// import { Mailable } from './interfaces/mail.interface';
import { mailgunConfig } from '../lib/configs/mailgun.config';
import {
    getPasswordResetEmail,
    getUserInviteEmail,
    getVerificationEmailTemplate,
    getWelcomeEmailTemplate,
} from './mail.templates';
import { User } from 'src/user/user.entity';
import { AuthPayload } from 'src/auth/auth.service';
import { captureException } from '@sentry/node';

@Injectable()
export class MailService {
    constructor(private mailgunService: MailgunService) {}

    async sendEmail(emailAddress: string, subject: string, content: string) {
        try {
            const options: EmailOptions = {
                from: mailgunConfig.EMAIL_ADDRESS,
                to: emailAddress,
                subject,
                html: content,
            };

            if (mailgunConfig.USERNAME !== 'none' && mailgunConfig.KEY !== 'none') {
                await this.mailgunService.createEmail(mailgunConfig.DOMAIN, options);
            }
        } catch (e) {
            captureException(e);
            // This service is not exposed to GraphQL thus it doesnt need to throw GraphQL error.
            // It should silently error.
            console.error('Mailgun service error:', e);
        }
    }

    async sendVerificationEmail(token: string, email: string) {
        const verificationUrl = `${
            mailgunConfig.BASE_URI_CONFIG.DASHBOARD
        }/signup/basename?token=${token}&identity=${Buffer.from(email, 'utf8').toString('base64')}`;
        const html = getVerificationEmailTemplate(verificationUrl);
        await this.sendEmail(email, 'Signup Verification Code', html);
    }

    async sendWelcomeEmail(email: string) {
        const html = getWelcomeEmailTemplate();
        await this.sendEmail(email, 'Welcome to Vibe!', html);
    }

    async sendMemberInviteEmail(
        orgName: string,
        inviteCode: string,
        user: AuthPayload,
        email: string,
        inviteExistingUser: boolean
    ) {
        const registrationUrl = new URL(mailgunConfig.BASE_URI_CONFIG.DASHBOARD);
        registrationUrl.pathname = '/authentication/orgInvite/';
        registrationUrl.searchParams.append('inviteCode', inviteCode);
        registrationUrl.searchParams.append('identity', Buffer.from(email, 'utf8').toString('base64'));
        registrationUrl.searchParams.append('exist', inviteExistingUser.toString());

        const html = getUserInviteEmail(registrationUrl.toString(), user, orgName);
        await this.sendEmail(email, "You're invited to Vibe!", html);
    }

    async sendForgotPasswordEmail(token: string, email: string, name: string) {
        const resetPasswordUrl = `${mailgunConfig.BASE_URI_CONFIG.DASHBOARD}/signin/newpassword?identity=${Buffer.from(
            email,
            'utf8'
        ).toString('base64')}&token=${token}`;

        const html = getPasswordResetEmail(resetPasswordUrl, name);
        await this.sendEmail(email, 'You have requested to reset password', html);
    }
}
