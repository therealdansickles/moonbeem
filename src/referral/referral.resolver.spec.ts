import { faker } from '@faker-js/faker';
import * as request from 'supertest';
import { getToken } from '../test-utils';

export const gql = String.raw;

describe('Referral', function () {
    let app;
    let userService;
    beforeAll(() => {
        app = global.app;
        userService = global.userService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    it('should create a referral', async () => {
        const referralCode = 'super-secret-referral-code';
        const query = gql`
            mutation CreateReferral($input: CreateReferralInput!) {
                createReferral(input: $input) {
                    id
                    referralCode
                }
            }
        `;

        const variables = {
            input: {
                collectionId: faker.string.uuid(),
                tokenId: faker.string.numeric(12),
                referralCode,
            }
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
            });
    });
});
