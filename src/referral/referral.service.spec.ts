import { faker } from '@faker-js/faker';
import { generateReferralCode } from '../nft/nft.utils';
import { createCollection2, createTier2 } from '../test-utils';

describe('Referral', function () {
    let referralService;
    let nftService;

    beforeAll(() => {
        referralService = global.referralService;
        nftService = global.nftService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
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
        expect(actual.count).toEqual(1);
    });

    it('should get referrals by referral code', async () => {
        const referral = {
            referralCode: faker.string.sample(12),
            collectionId: faker.string.uuid(),
            tokenId: faker.string.numeric(),
            count: 2,
        };
        await referralService.createReferral(referral);
        const actual = await referralService.getReferralsByReferralCode(referral.referralCode);
        expect(actual.length).toEqual(1);
        expect(actual[0].id).toBeDefined();
        expect(actual[0].referralCode).toEqual(referral.referralCode);
        expect(actual[0].collectionId).toEqual(referral.collectionId);
        expect(actual[0].tokenId).toEqual(referral.tokenId);
        expect(actual[0].count).toEqual(referral.count);
    });

    it('should update nft referral count', async () => {
        const collection = await createCollection2();
        const tier = await createTier2({
            collection: {
                id: collection.id,
            }
        });
        const referralCode = generateReferralCode(12);
        await nftService.createOrUpdateNftByTokenId({
            collectionId: collection.id,
            tierId: tier.id,
            tokenId: faker.string.numeric(),
            properties: {
                referral_code: {
                    name: 'Referral Code',
                    value: referralCode,
                    type: 'string'
                },
                referral_count: {
                    name: 'Referral Count',
                    value: 2,
                    type: 'number'
                },
            }
        });

        const actual = await referralService.updateNftReferralCount(collection.id, referralCode, 3);
        expect(actual.properties.referral_count.value).toEqual(5);
    });
});
