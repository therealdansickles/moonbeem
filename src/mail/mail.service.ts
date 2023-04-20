import { Injectable } from '@nestjs/common';
import { MailgunService, EmailOptions } from '@nextnm/nestjs-mailgun';
// import { Mailable } from './interfaces/mail.interface';
import { mailgunConfig } from '../lib/configs/mailgun.config';
import { getPasswordResetEmail, getUserInviteEmail, getVerificationEmailTemplate, getWelcomeEmailTemplate } from './mail.templates';

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
            console.log('mailgun api error:', e);
        }
    }

    async sendVerificationEmail(token: string, email: string) {
        const verificationUrl = `${mailgunConfig.BASE_URI_CONFIG.DASHBOARD}/signup/basename?token=${token}&identity=${Buffer.from(email, 'utf8').toString('base64')}`;
        const html = getVerificationEmailTemplate(verificationUrl);
        await this.sendEmail(email, 'Signup Verification Code', html);
    }

    async sendWelcomeEmail(email: string) {
        const html = getWelcomeEmailTemplate();
        await this.sendEmail(email, 'Welcome to Vibe!', html);
    }

    async sendMemberInviteEmail(email: string, name: string, orgName: string, inviteCode: string) {
        const registrationUrl = `${mailgunConfig.BASE_URI_CONFIG.DASHBOARD}/authentication/orgInvite/?inviteCode=${inviteCode}&identity=${Buffer.from(email, 'utf8').toString('base64')}`;
        const html = getUserInviteEmail(registrationUrl, name || email, orgName);
        await this.sendEmail(email, "You're invited to Vibe!", html);
    }

    async sendForgotPasswordEmail(token: string, email: string, name: string) {
        const resetPasswordUrl = `${mailgunConfig.BASE_URI_CONFIG.DASHBOARD}/signin/newpassword?identity=${Buffer.from(email, 'utf8').toString('base64')}&token=${token}`;

        const html = getPasswordResetEmail(resetPasswordUrl, name);
        await this.sendEmail(email, 'You have requested to reset password', html);
    }
}
