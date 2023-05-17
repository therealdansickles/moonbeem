import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { Organization } from './organization.entity';
import { OrganizationModule } from './organization.module';
import { OrganizationService } from './organization.service';

import { UserService } from '../user/user.service';

export const gql = String.raw;

describe('OrganizationResolver', () => {
    let repository: Repository<Organization>;
    let service: OrganizationService;
    let userService: UserService;
    let app: INestApplication;
    let organization: Organization;

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
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                    dropSchema: true,
                }),
                OrganizationModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [OrganizationModule],
                }),
            ],
        }).compile();

        repository = module.get('OrganizationRepository');
        service = module.get<OrganizationService>(OrganizationService);
        userService = module.get<UserService>(UserService);
        app = module.createNestApplication();

        const owner = await userService.createUser({
            email: faker.internet.email(),
            password: faker.internet.password(),
        });

        organization = await service.createOrganization({
            name: faker.company.name(),
            displayName: faker.company.name(),
            about: faker.company.catchPhrase(),
            avatarUrl: faker.image.imageUrl(),
            backgroundUrl: faker.image.imageUrl(),
            websiteUrl: faker.internet.url(),
            twitter: faker.internet.userName(),
            instagram: faker.internet.userName(),
            discord: faker.internet.userName(),
            owner: owner,
        });

        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('organization', () => {
        it('should return an organization', async () => {
            let newOwner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            let newOrganization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: newOwner,
            });

            const query = gql`
                query GetOrg($id: String!) {
                    organization(id: $id) {
                        id

                        collections {
                            id
                        }

                        memberships {
                            id
                        }

                        collaborations {
                            id
                        }
                    }
                }
            `;

            const variables = {
                id: newOrganization.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.organization.id).toEqual(newOrganization.id);
                    expect(body.data.organization.collections).toBeDefined();
                    expect(body.data.organization.memberships).toBeDefined();
                    expect(body.data.organization.collaborations).toBeDefined();
                });
        });
    });

    describe('createOrganization', () => {
        it('should allow authenticated users to create an organization', async () => {
            const query = gql`
                mutation CreateOrganization($input: CreateOrganizationInput!) {
                    createOrganization(input: $input) {
                        id
                        name
                    }
                }
            `;

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const variables = {
                input: {
                    name: faker.company.name(),
                    displayName: faker.company.name(),
                    about: faker.company.catchPhrase(),
                    avatarUrl: faker.image.imageUrl(),
                    backgroundUrl: faker.image.imageUrl(),
                    websiteUrl: faker.internet.url(),
                    twitter: faker.internet.userName(),
                    instagram: faker.internet.userName(),
                    discord: faker.internet.userName(),
                    owner: {
                        id: owner.id,
                    },
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createOrganization.name).toEqual(variables.input.name);
                });
        });
    });

    describe('updateOrganization', () => {
        it('should update an organization', async () => {
            let newOwner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            let newOrganization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: newOwner,
            });

            const query = gql`
                mutation updateOrganization($input: UpdateOrganizationInput!) {
                    updateOrganization(input: $input) {
                        displayName
                    }
                }
            `;

            const variables = {
                input: {
                    id: newOrganization.id,
                    displayName: faker.company.name(),
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateOrganization.displayName).toEqual(variables.input.displayName);
                });
        });
    });

    describe('deleteOrganization', () => {
        it('should delete an organization', async () => {
            let newOwner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            let newOrganization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: newOwner,
            });

            const query = gql`
                mutation deleteOrganization($input: OrganizationInput!) {
                    deleteOrganization(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: newOrganization.id,
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.deleteOrganization).toBeTruthy();
                });
        });
    });

    describe('transferOrganization', () => {
        it('should transfer an organization', async () => {
            const oldOwner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const newOwner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const transferedOrganization = await service.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.imageUrl(),
                backgroundUrl: faker.image.imageUrl(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: {
                    id: oldOwner.id,
                },
            });

            const query = gql`
                mutation transferOrganization($input: TransferOrganizationInput!) {
                    transferOrganization(input: $input) {
                        owner {
                            id
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    id: transferedOrganization.id,
                    ownerId: newOwner.id,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.transferOrganization.owner.id).toEqual(newOwner.id);
                });
        });
    });
});
