import { createCollection2, createNft, createTier2, createUser, createWallet } from '../test-utils';
import { AnalyticsService } from './analytics.service';

describe('Analytics service', function () {
    let analyticsService: AnalyticsService;

    beforeAll(async () => {
        analyticsService = global.analyticsService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        (await global.gc) && (await global.gc());
    });

    describe('getMintSaleCollectionData', function () {
        it('should return 3 days collection data and total count', async () => {
            for (let i = 0; i < 5; i++) {
                const createdAt = new Date();
                createdAt.setDate(createdAt.getDate() - i);
                await createCollection2({
                    createdAt,
                });
            }
            const data = await analyticsService.getMintSaleCollectionData(3);
            expect(data.length).toBe(3);

            const totalCount = await analyticsService.getMintSaleCollectionsCount();
            expect(totalCount).toBe(5);
        });
    });

    describe('getMintedNFTsData', function () {
        it('should return 3 days nft data and total count', async () => {
            const collection = await createCollection2();
            const tier = await createTier2({
                collection: {
                    id: collection.id,
                },
            });
            for (let i = 0; i < 5; i++) {
                const createdAt = new Date();
                createdAt.setDate(createdAt.getDate() - i);
                const tokenId = i.toString();
                await createNft(collection.id, tier.id, {
                    createdAt,
                    tokenId,
                });
            }
            const data = await analyticsService.getMintedNFTsData(3);
            expect(data.length).toBe(3);

            const totalCount = await analyticsService.getMintedNFTsCount();
            expect(totalCount).toBe(5);
        });
    });

    describe('getTotalCreatorsData', function () {
        it('should return 3 days creator data and total count', async () => {
            for (let i = 0; i < 5; i++) {
                const createdAt = new Date();
                createdAt.setDate(createdAt.getDate() - i);
                await createUser({
                    createdAt,
                });
            }
            const data = await analyticsService.getTotalCreatorsData(3);
            expect(data.length).toBe(3);

            const totalCount = await analyticsService.getTotalCreatorsCount();
            expect(totalCount).toBe(5);
        });
    });

    describe('getTotalUsersData', function () {
        it('should return 3 days user data and total count', async () => {
            for (let i = 0; i < 5; i++) {
                const createdAt = new Date();
                createdAt.setDate(createdAt.getDate() - i);
                await createWallet({
                    createdAt,
                });
            }
            const user = await createUser();
            const date = new Date();
            date.setDate(date.getDate() - 1);
            await createWallet({
                createdAt: date,
                ownerId: user.id,
            });
            const data = await analyticsService.getTotalUsersData(3);
            expect(data.length).toBe(3);
            expect(data.map((s) => s.count)).toEqual(expect.arrayContaining([1, 1, 2]));

            const totalCount = await analyticsService.getTotalUsersCount();
            expect(totalCount).toBe(6);
        });
    });
});
