import { MoonpayUrl } from './moonpay.dto';

describe('MoonpayUrl', () => {
    it('should be defined', () => {
        const moonpayUrl = new MoonpayUrl();
        expect(moonpayUrl).toBeDefined();
    });

    it('should have a valid url property', () => {
        const moonpayUrl = new MoonpayUrl();
        moonpayUrl.url = 'https://example.com/moonpay-url';

        expect(moonpayUrl.url).toEqual('https://example.com/moonpay-url');
    });
});
