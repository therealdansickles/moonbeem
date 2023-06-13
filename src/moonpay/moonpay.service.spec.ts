import { MoonpayService } from './moonpay.service';
import * as crypto from 'crypto';

describe('MoonpayService', () => {
    let moonpayService: MoonpayService;

    beforeEach(() => {
        moonpayService = new MoonpayService();
    });

    it('should generate a valid signature', () => {
        const currencyCode = 'USD';
        const walletAddress = '0x123abc';
        const expectedUrlWithSignature = {
            url: 'https://mocked-url.com?apiKey=mocked-public-key&currencyCode=USD&walletAddress=0x123abc&signature=base64-encoded-signature',
        };

        process.env.MOONPAY_URL = 'https://mocked-url.com';
        process.env.MOONPAY_PK = 'mocked-public-key';
        process.env.MOONPAY_SK = 'mocked-secret-key';

        const digestfn = jest.fn().mockReturnValue('base64-encoded-signature');
        const updatefn = jest.fn().mockReturnValue({ digest: digestfn });
        const createHmac = jest.fn().mockReturnValue({ update: updatefn });

        jest.spyOn(crypto, 'createHmac').mockImplementation(createHmac as any);

        const generatedUrlWithSignature = moonpayService.generateMoonpayUrlWithSignature(currencyCode, walletAddress);

        expect(createHmac).toHaveBeenCalledWith('sha256', process.env.MOONPAY_SK);
        expect(updatefn).toHaveBeenCalledWith(expect.any(String));
        expect(digestfn).toHaveBeenCalledWith('base64');

        expect(generatedUrlWithSignature).toEqual(expectedUrlWithSignature);
    });
});
