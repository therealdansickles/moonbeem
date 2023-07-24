import { hashSync as hashPassword } from 'bcryptjs';
import * as request from 'supertest';

import { faker } from '@faker-js/faker';
import { INestApplication } from '@nestjs/common';

import { CollectionService } from '../collection/collection.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { Collaboration } from './collaboration.entity';
import { CollaborationService } from './collaboration.service';

export const gql = String.raw;

describe('CollaborationResolver', () => {
    let app: INestApplication;
    let userService: UserService;
    let collaboration: Collaboration;
    let service: CollaborationService;
    let collectionService: CollectionService;
    let organizationService: OrganizationService;
    let walletService: WalletService;

    beforeAll(async () => {
        app = global.app;

        userService = global.userService;
        walletService = global.walletService;
        service = global.collaborationService;
        collectionService = global.collectionService;
        organizationService = global.organizationService;
    });

    beforeEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('createCollaboration', () => {
        let organization: Organization;
        let user: User;

        beforeEach(async () => {
            user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: user,
            });
        });

        it('should forbid is not signed in', async () => {
            const wallet = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });

            const query = gql`
                mutation CreateCollaboration($input: CreateCollaborationInput!) {
                    createCollaboration(input: $input) {
                        id
                        name
                        royaltyRate
                        collaborators {
                            name
                            role
                        }

                        organization {
                            id
                            name
                        }

                        user {
                            id
                            username
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    name: faker.hacker.noun(),
                    walletId: wallet.id,
                    organizationId: organization.id,
                    userId: user.id,
                    royaltyRate: 9,
                    collaborators: [
                        {
                            address: faker.finance.ethereumAddress(),
                            role: faker.finance.accountName(),
                            name: faker.finance.accountName(),
                            rate: parseInt(faker.random.numeric(2)),
                        },
                    ],
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors[0].extensions.code).toEqual('FORBIDDEN');
                    expect(body.data).toBeNull();
                });
        });

        it('should create a collaboration', async () => {
            const wallet = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            const tokenQuery = gql`
                mutation CreateSessionFromEmail($input: CreateSessionFromEmailInput!) {
                    createSessionFromEmail(input: $input) {
                        token
                        user {
                            id
                            email
                        }
                    }
                }
            `;

            const tokenVariables = {
                input: {
                    email: user.email,
                    password: await hashPassword(user.password, 10),
                },
            };

            const tokenRs = await request(app.getHttpServer())
                .post('/graphql')
                .send({ query: tokenQuery, variables: tokenVariables });

            const { token } = tokenRs.body.data.createSessionFromEmail;

            const query = gql`
                mutation CreateCollaboration($input: CreateCollaborationInput!) {
                    createCollaboration(input: $input) {
                        id
                        name
                        royaltyRate
                        collaborators {
                            name
                            role
                        }

                        organization {
                            id
                            name
                        }

                        user {
                            id
                            username
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    name: faker.hacker.noun(),
                    walletId: wallet.id,
                    organizationId: organization.id,
                    userId: user.id,
                    royaltyRate: 9,
                    collaborators: [
                        {
                            address: faker.finance.ethereumAddress(),
                            role: faker.finance.accountName(),
                            name: faker.finance.accountName(),
                            rate: parseInt(faker.random.numeric(2)),
                        },
                    ],
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .auth(token, { type: 'bearer' })
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createCollaboration.royaltyRate).toEqual(variables.input.royaltyRate);
                    expect(body.data.createCollaboration.name).toEqual(variables.input.name);
                    expect(body.data.createCollaboration.organization.id).toEqual(variables.input.organizationId);
                    expect(body.data.createCollaboration.organization.name).toEqual(organization.name);
                    expect(body.data.createCollaboration.user.id).toEqual(variables.input.userId);
                    expect(body.data.createCollaboration.user.username).toEqual(user.username);

                    collaboration = body.data.createCollaboration;
                });
        });
    });

    describe('getCollaboration', () => {
        it('should get a collaboration if we had right id', async () => {
            const wallet = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            collaboration = await service.createCollaboration({
                walletId: wallet.id,
                royaltyRate: 12,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const query = gql`
                query Collaboration($id: String!) {
                    collaboration(id: $id) {
                        id
                        royaltyRate

                        wallet {
                            address
                        }
                    }
                }
            `;

            const variables = {
                id: collaboration.id,
            };

            // FIXME: This is flakey sometimes. Unique index contraint issues?
            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.collaboration.id).toEqual(variables.id);
                    expect(body.data.collaboration.wallet.address).not.toBeNull();
                });
        });
    });

    describe('collaborations', () => {
        it('should get a collaborations for a user id and org id', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: user,
            });

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                chainId: 1,
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization,
            });

            const wallet = await walletService.createWallet({
                address: `arb:${faker.finance.ethereumAddress()}`,
                ownerId: user.id,
            });

            await service.createCollaboration({
                walletId: wallet.id,
                royaltyRate: 12,
                userId: user.id,
                organizationId: organization.id,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const query = gql`
                query Collaboration($userId: String!, $organizationId: String!) {
                    collaborations(userId: $userId, organizationId: $organizationId) {
                        id
                        royaltyRate

                        user {
                            id
                        }

                        organization {
                            id
                        }
                    }
                }
            `;

            const variables = {
                userId: user.id,
                organizationId: organization.id,
            };

            // FIXME: This is flakey sometimes. Unique index contraint issues?
            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    const [collab] = body.data.collaborations;
                    expect(collab.user.id).toEqual(variables.userId);
                    expect(collab.organization.id).toEqual(variables.organizationId);
                });
        });
    });
});
