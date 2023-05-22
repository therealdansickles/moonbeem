import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { Collaboration } from './collaboration.entity';
import { CollaborationModule } from './collaboration.module';
import { CollaborationService } from './collaboration.service';
import { Collection } from '../collection/collection.dto';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationService } from '../organization/organization.service';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { WalletService } from '../wallet/wallet.service';

export const gql = String.raw;

describe('CollaborationResolver', () => {
    let app: INestApplication;
    let repository: Repository<Collaboration>;
    let service: CollaborationService;
    let collaboration: Collaboration;
    let collection: Collection;
    let collectionService: CollectionService;
    let organization: Organization;
    let organizationService: OrganizationService;
    let user: User;
    let userService: UserService;
    let wallet: Wallet;
    let walletService: WalletService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                CollaborationModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [CollaborationModule, CollectionModule, WalletModule],
                }),
            ],
        }).compile();

        repository = module.get('CollaborationRepository');
        service = module.get<CollaborationService>(CollaborationService);
        walletService = module.get<WalletService>(WalletService);
        collectionService = module.get<CollectionService>(CollectionService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        userService = module.get<UserService>(UserService);

        wallet = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });

        collection = await collectionService.createCollection({
            name: faker.company.name(),
            displayName: 'The best collection',
            about: 'The best collection ever',
            address: faker.finance.ethereumAddress(),
            artists: [],
            tags: [],
        });

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
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

        it('should create a collaboration', async () => {
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
            wallet = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
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

            const collection = await collectionService.createCollection({
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

            const collab = await service.createCollaboration({
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
                    const [collab, ...rest] = body.data.collaborations;
                    expect(collab.user.id).toEqual(variables.userId);
                    expect(collab.organization.id).toEqual(variables.organizationId);
                });
        });
    });
});
