import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import Client from 'mailgun.js/client';
import { mailgunConfig } from '../configs/mailgun.config';
import { getPasswordResetEmail, getUserInviteEmail, getVerificationEmailTemplate, getWelcomeEmailTemplate } from '../configs/email.tempaltes.config';

export class MailgunAdapter {
    private mailgun: Client;
    constructor() {
        this.mailgun = new Mailgun(FormData).client({
            username: mailgunConfig.USERNAME,
            key: mailgunConfig.KEY,
        });
    }

    async sendEmail(emailAddress: string, subject: string, content: string) {
        try {
            await this.mailgun.messages.create(mailgunConfig.DOMAIN, {
                from: mailgunConfig.EMAIL_ADDRESS,
                to: emailAddress,
                subject,
                html: content,
            });
        } catch (e) {
            console.error('Mailgun error:', e);
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

    async sendMemberInviteEmail(email: string, token: string, name: string, orgName: string, existingUser: boolean) {
        const inviteView = existingUser ? 'invite-accept' : 'invite';
        const registrationUrl = `${mailgunConfig.BASE_URI_CONFIG.DASHBOARD}/authentication/${inviteView}?token=${token}&identity=${Buffer.from(email, 'utf8').toString('base64')}`;
        const html = getUserInviteEmail(registrationUrl, name, orgName);
        await this.sendEmail(email, "You're invited to Vibe!", html);
    }

    async sendForgotPasswordEmail(token: string, email: string, name: string) {
        const resetPasswordUrl = `${mailgunConfig.BASE_URI_CONFIG.DASHBOARD}/signin/newpassword?identity=${Buffer.from(email, 'utf8').toString('base64')}&token=${token}`;

        const html = getPasswordResetEmail(resetPasswordUrl, name);
        await this.sendEmail(email, 'You have requested to reset password', html);
    }
}
