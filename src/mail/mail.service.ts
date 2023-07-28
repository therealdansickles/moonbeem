import * as Mustache from 'mustache';
import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import * as fsPromise from 'fs/promises';
import * as mjml from 'mjml';
import { Injectable } from '@nestjs/common';
import { MailgunService, EmailOptions } from '@nextnm/nestjs-mailgun';

dotenv.config();

@Injectable()
export class MailService {
    constructor(private mailgunService: MailgunService) {}

    /**
     * Send an email using Mailgun
     *
     * @param emailAddress - The email address to send the email to
     * @param subject - The subject of the email
     * @param content - The content of the email
     *
     * @returns
     */
    async sendEmail(emailAddress: string, subject: string, content: string): Promise<void> {
        const domain = process.env.MAILGUN_DOMAIN || 'mail.vibe-support.xyz';

        const options: EmailOptions = {
            from: process.env.MAILGUN_FROM_EMAIL || 'support@vibe-support.xyz',
            to: emailAddress,
            subject,
            html: content,
        };

        await this.mailgunService.createEmail(domain, options);
    }

    /**
     * Render a MJML email template with data
     *
     * @param templateName - The template name to render (not full path)
     * @param data - The data to render the template with
     *
     * @returns The rendered template
     */
    async renderTemplate(templateName: string, data: any): Promise<string> {
        const template = await fsPromise.readFile(`./src/mail/templates/${templateName}`, 'utf8');
        const rendered = await Mustache.render(template, data);
        return mjml(rendered).html;
    }

    /**
     * Send a welcome email to a user
     *
     * @param emailAddress - The email address to send the email to
     * @param data - The data to render the template with
     * @returns
     */
    async sendWelcomeEmail(emailAddress: string, data: any) {
        const content = await this.renderTemplate('welcome.mjml', data);
        await this.sendEmail(emailAddress, 'Welcome to Vibe!', content);
    }

    /**
     * Send a verification email to a user
     *
     * @param emailAddress - The email address to send the email to
     * @param token - The string of the verificationToken
     * @returns
     */
    async sendVerificationEmail(emailAddress: string, token: string): Promise<void> {
        const content = await this.renderTemplate('verification.mjml', {ctaUrl: this.generateVerificationUrl(emailAddress, token)});
        await this.sendEmail(emailAddress, 'Your Signup Verification Code on Vibe', content);
    }


    /**
     * Send an invite email to a user
     *
     * @param emailAddress - The email address to send the email to
     * @param token - The jwt token for the invite. (inviteCode)
     * @returns
     */
    async sendInviteEmail(emailAddress: string, token: string): Promise<void> {
        const content = await this.renderTemplate('invite.mjml', {ctaUrl: this.generateInviteUrl(emailAddress, token)});
        await this.sendEmail(emailAddress, 'You have been invited into a workspace on Vibe', content);
    }

    /**
     * Send a password reset email to a user
     *
     * @param emailAddress - The email address to send the email to
     * @param data - The data to render the template with
     * @returns
     */
    async sendPasswordResetEmail(emailAddress: string, data: any): Promise<void> {
        const content = await this.renderTemplate('reset.mjml', {ctaUrl: this.generatePasswordResetUrl(emailAddress, data.token)});
        await this.sendEmail(emailAddress, 'Your Password Reset Code on Vibe', content);
    }

    /**
     * Generates the dashboard verification url.
     *
     * @param emailAddress - The email address to send the email to
     * @param token - The token to use for verification
     *
     * @returns The verification url
     */
    generateVerificationUrl(emailAddress: string, token: string): string {
        const verificationUrl = this.generateDashboardUrl(emailAddress);
        verificationUrl.pathname = '/onboard';
        verificationUrl.searchParams.append('token', token);
        return verificationUrl.toString();
    }

    /**
     * Generates the dashboard password reset url.
     *
     * @param emailAddress - The email address to send the email to
     * @param token - The token to use for password reset
     * @returns The password reset url
     */
    generatePasswordResetUrl(emailAddress: string, token: string): string {
        const resetUrl = this.generateDashboardUrl(emailAddress);
        resetUrl.pathname = '/signin/newpassword';
        resetUrl.searchParams.append('token', token);
        return resetUrl.toString();
    }

    /**
     * Generates the dashboard invite url.
     *
     * @param emailAddress - The email address to send the email to
     * @param token - The token to use for invite
     * @returns The invite url
     */
    generateInviteUrl(emailAddress: string, token: string): string {
        const inviteUrl = this.generateDashboardUrl(emailAddress);
        const inviteCode = this.encodeBase64(token);
        inviteUrl.pathname = '/onboard/invite';
        inviteUrl.searchParams.append('inviteCode', inviteCode);
        return inviteUrl.toString();
    }

    /**
     * Generates the base dashboard url.
     *
     * @param email - The email address to send the email to
     * @returns The dashboard URL object
     */
    private generateDashboardUrl(email: string): URL {
        const dashboardUrl = new URL(process.env.DASHBOARD_URL || 'https://dashboard.vibe.xyz');
        const encodedEmail = this.encodeBase64(email);
        dashboardUrl.searchParams.append('identity', encodedEmail); // TODO: This was a legacy port. Probably change to another key
        return dashboardUrl;
    }

    /**
     * Encodes a string to base64
     *
     * @param str - The string to encode
     */
    private encodeBase64(str: string): string {
        return Buffer.from(str, 'utf8').toString('base64');
    }
}
