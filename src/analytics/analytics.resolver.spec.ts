import * as request from 'supertest';
import { createCollection2, createNft, createTier2, createUser, createWallet, getToken } from '../test-utils';

export const gql = String.raw;

describe('CollectionResolver', () => {
    let app;

    beforeEach(() => {
        app = global.app;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('analytics', () => {
        it('should return platform stats', async () => {
            const tokenEmail = 'any-user@vibe.xyz';
            await createUser({
                email: tokenEmail,
                password: 'password',
            });
            const token = await getToken(app, tokenEmail);
            const query = gql`
                query GetPlatformStats {
                    analytics {
                        totalCounts {
                            mintSaleCollectionsCount
                            mintedNFTsCount
                            totalCreatorsCount
                            totalUsersCount
                        }
                        platformData {
                            mintSaleCollectionsData {
                                date
                                count
                            }
                            mintedNFTsData {
                                date
                                count
                            }
                            totalCreatorsData {
                                date
                                count
                            }
                            totalUsersData {
                                date
                                count
                            }
                        }
                    }
                }
            `;

            const collection = await createCollection2();
            const tier = await createTier2({
                collection: {
                    id: collection.id,
                },
            });
            for (let i = 1; i < 6; i++) {
                const createdAt = new Date();
                createdAt.setDate(createdAt.getDate() - i);
                await createCollection2({
                    createdAt,
                });
                const tokenId = i.toString();
                await createNft(collection.id, tier.id, {
                    createdAt,
                    tokenId,
                });
                await createUser({
                    createdAt,
                });
                await createWallet({
                    createdAt,
                });
            }

            return await request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query })
                .expect(({ body }) => {
                    const analytics = body.data.analytics;
                    expect(analytics.totalCounts.mintSaleCollectionsCount).toEqual(6);
                    expect(analytics.totalCounts.mintedNFTsCount).toEqual(5);
                    expect(analytics.totalCounts.totalCreatorsCount).toEqual(6);
                    expect(analytics.totalCounts.totalUsersCount).toEqual(5);
                    expect(analytics.platformData.mintSaleCollectionsData.length).toEqual(5);
                    expect(analytics.platformData.mintedNFTsData.length).toEqual(5);
                    expect(analytics.platformData.totalCreatorsData.length).toEqual(5);
                    expect(analytics.platformData.totalUsersData.length).toEqual(5);
                });
        });
    });
});
