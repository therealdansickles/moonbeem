import { faker } from '@faker-js/faker';

describe('Referral', function () {
    let referralService;
    beforeAll(() => {
        referralService = global.referralService;
    });
    it('should create a referral', async () => {
        const referral = {
            referralCode: faker.string.sample(12),
            collectionId: faker.string.uuid(),
            tokenId: faker.string.numeric(),
        };
        const actual = await referralService.createReferral(referral);
        expect(actual).toMatchObject({
            referralCode: referral.referralCode,
            collectionId: referral.collectionId,
            tokenId: referral.tokenId,
        });
        expect(actual.id).toBeDefined();
    });

    it('should get referrals by referral code', async () => {
        const referral = {
            referralCode: faker.string.sample(12),
            collectionId: faker.string.uuid(),
            tokenId: faker.string.numeric(),
        };
        await referralService.createReferral(referral);
        const actual = await referralService.getReferralsByReferralCode(referral.referralCode);
        expect(actual.length).toEqual(1);
        expect(actual[0].id).toBeDefined();
        expect(actual[0].referralCode).toEqual(referral.referralCode);
        expect(actual[0].collectionId).toEqual(referral.collectionId);
        expect(actual[0].tokenId).toEqual(referral.tokenId);
    });
});
