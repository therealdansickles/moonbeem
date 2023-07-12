import { MoonpayService } from './moonpay.service';
import { ethers } from 'ethers';

describe('MoonpayService', () => {
    let moonpayService: MoonpayService;

    beforeEach(() => {
        moonpayService = new MoonpayService();
    });

    it('should generate a valid signature', async () => {
        const wallet = ethers.Wallet.createRandom();
        const message = 'Generate moonpay url.';
        const signature = await wallet.signMessage(message);

        const moonpayUrl = moonpayService.generateMoonpayUrlWithSignature({
            currency: 'USD',
            theme: 'light',
            address: wallet.address,
            signature: signature,
            message: message,
        });

        expect(moonpayUrl.url).toBeDefined();
    });

    it('should return throw an error because of bad signature sent', async () => {
        const wallet = ethers.Wallet.createRandom();
        const message = 'Generate moonpay url.';

        try {
            await moonpayService.generateMoonpayUrlWithSignature({
                currency: 'USD',
                theme: 'light',
                address: wallet.address,
                signature: '',
                message: message,
            });
        } catch (error) {
            expect((error as Error).message).toBe('signature verification failure');
        }
    });
});
