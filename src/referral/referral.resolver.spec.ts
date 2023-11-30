import { faker } from '@faker-js/faker';
import * as request from 'supertest';
import { createCollection2, createTier2, getToken } from '../test-utils';

export const gql = String.raw;

describe('Referral', function () {
    let app;
    let userService;
    let nftService;
    beforeAll(() => {
        app = global.app;
        userService = global.userService;
        nftService = global.nftService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    it('should create a referral', async () => {
        const collection = await createCollection2();
        const tier = await createTier2({
            collection: {
                id: collection.id,
            },
            metadata: {
                conditions: {
                    rules: [
                        {
                            name: 'referral',
                            property: 'referral_points',
                            update: [
                                {
                                    action: 'increase',
                                    value: 10,
                                    property: 'referral_points',
                                },
                            ],
                        },
                    ],
                },
            },
        });
        const referralCode = 'super-secret-referral-code';
        const nft = await nftService.createOrUpdateNftByTokenId({
            collectionId: collection.id,
            tierId: tier.id,
            tokenId: faker.string.numeric(),
            properties: {
                referral_code: {
                    name: 'Referral Code',
                    value: referralCode,
                    type: 'string',
                },
                referral_points: {
                    name: 'Referral Points',
                    value: 2,
                    type: 'number',
                },
            },
        });
        const query = gql`
            mutation CreateReferral($input: CreateReferralInput!) {
                createReferral(input: $input) {
                    id
                    referralCode
                    count
                }
            }
        `;

        const variables = {
            input: {
                collectionId: collection.id,
                tokenId: nft.tokenId,
                referralCode,
            },
        };

        const user = await userService.createUser({
            username: faker.internet.userName(),
            email: faker.internet.email(),
            password: 'password',
        });
        const token = await getToken(app, user.email);

        return request(app.getHttpServer())
            .post('/graphql')
            .auth(token, { type: 'bearer' })
            .send({ query, variables })
            .expect(200)
            .expect(({ body }) => {
                expect(body.data.createReferral.referralCode).toEqual(referralCode);
                expect(body.data.createReferral.id).toBeDefined();
                expect(body.data.createReferral.count).toEqual(1);
            });
    });

    it('should return invalid referral code', async () => {
        const query = gql`
            mutation CreateReferral($input: CreateReferralInput!) {
                createReferral(input: $input) {
                    id
                    referralCode
                    count
                }
            }
        `;

        const variables = {
            input: {
                collectionId: faker.string.uuid(),
                tokenId: faker.string.numeric(1),
                referralCode: 'wrong code',
            },
        };

        const user = await userService.createUser({
            username: faker.internet.userName(),
            email: faker.internet.email(),
            password: 'password',
        });
        const token = await getToken(app, user.email);

        return request(app.getHttpServer())
            .post('/graphql')
            .auth(token, { type: 'bearer' })
            .send({ query, variables })
            .expect(200)
            .expect(({ body }) => {
                expect(body.errors[0].extensions.code).toEqual('BAD_REQUEST');
            });
    });
});
