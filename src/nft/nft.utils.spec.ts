import { generateReferralCode } from './nft.utils';

describe('nft utils', () => {
    describe('generateReferralCode', () => {
        it('should return a string with length 6', () => {
            const actual = generateReferralCode(6);
            expect(actual).toHaveLength(6);
            expect.stringMatching(/[A-Za-z0-9]{6}/);
        });
    });
});
