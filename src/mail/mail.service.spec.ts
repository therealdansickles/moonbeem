import { MailService } from './mail.service';

describe('MailService', () => {
    let service: MailService;

    beforeAll(async () => {
        service = global.mailService;
    });

    describe('renderTemplate', () => {
        it('should render a template', async () => {
            const result = await service.renderTemplate('welcome.mjml', {ctaUrl: 'hello'});
            expect(result).toMatch(/Welcome/);
        });

        it('should render a template with data', async () => {
            const result = await service.renderTemplate('welcome.mjml', {});
            expect(result).toMatch(/Welcome/);
        });
    });

    it('should send a welcome email', async () => {
        jest.spyOn(service, 'renderTemplate').mockImplementation(async (template) => {
            expect(template).toBe('welcome.mjml');
            return 'welcome';
        });
        jest.spyOn(service, 'sendEmail').mockImplementation(async () => {});
        await service.sendWelcomeEmail('engineering+test@vibe.xyz', {});
    });

    it('should send a welcome email', async () => {
        jest.spyOn(service, 'renderTemplate').mockImplementation(async (template) => {
            expect(template).toBe('welcome.mjml');
            return 'welcome';
        });
        jest.spyOn(service, 'sendEmail').mockImplementation(async () => {});
        await service.sendWelcomeEmail('engineering+test@vibe.xyz', {});
    });

    it('should generate a verification url', async () => {
        const result = new URL(service.generateVerificationUrl('engineering+test@vibe.xyz', 'dashboard'));
        expect(result.pathname).toBe('/onboard');
        expect(result.searchParams.get('token')).toBe('dashboard');
        expect(result.searchParams.get('identity')).toBeDefined();
    });

    it('should generate a verification url', async () => {
        const result = new URL(service.generateVerificationUrl('engineering+test@vibe.xyz', 'dashboard'));
        expect(result.pathname).toBe('/onboard');
        expect(result.searchParams.get('token')).toBe('dashboard');
        expect(result.searchParams.get('identity')).toBeDefined();
    });

    it('should generate a password reset url', async () => {
        const result = new URL(service.generatePasswordResetUrl('engineering+test@vibe.xyz', 'dashboard'));
        expect(result.pathname).toBe('/signin/newpassword');
        expect(result.searchParams.get('token')).toBe('dashboard');
        expect(result.searchParams.get('identity')).toBeDefined();
    });

    it('should generate a invite url', async () => {
        const result = new URL(service.generateInviteUrl('engineering+test@vibe.xyz', 'dashboard'));
        expect(result.pathname).toBe('/authentication/orgInvite');
        expect(result.searchParams.get('inviteCode')).toBe('dashboard');
        expect(result.searchParams.get('identity')).toBeDefined();
    });

    it('should send a verification email', async () => {
        jest.spyOn(service, 'renderTemplate').mockImplementation(async (template) => {
            expect(template).toBe('verification.mjml');
            return 'verify';
        });
        jest.spyOn(service, 'sendEmail').mockImplementation(async () => {});
        await service.sendVerificationEmail('engineering+test@vibe.xyz', 'token');
    });

});
