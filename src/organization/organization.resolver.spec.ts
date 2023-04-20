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
import { CollaborationModule } from '../collaboration/collaboration.module';

export const gql = String.raw;

describe('OrganizationResolver', () => {
    let repository: Repository<Organization>;
    let service: OrganizationService;
    let app: INestApplication;
    let organization: Organization;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: postgresConfig.host,
                    port: postgresConfig.port,
                    username: postgresConfig.username,
                    password: postgresConfig.password,
                    database: postgresConfig.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
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
        app = module.createNestApplication();

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
        });

        await app.init();
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Organization" CASCADE');
        await app.close();
    });

    describe('organization', () => {
        it('should return an organization', async () => {
            const query = gql`
                query GetOrg($id: String!) {
                    organization(id: $id) {
                        id
                    }
                }
            `;

            const variables = {
                id: organization.id,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.organization.id).toEqual(organization.id);
                });
        });
    });

    describe('createOrganization', () => {
        it('should create an organization', async () => {
            const query = gql`
                mutation CreateOrganization($input: CreateOrganizationInput!) {
                    createOrganization(input: $input) {
                        id
                        name
                    }
                }
            `;

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
            const query = gql`
                mutation updateOrganization($input: UpdateOrganizationInput!) {
                    updateOrganization(input: $input) {
                        displayName
                    }
                }
            `;

            const variables = {
                input: {
                    id: organization.id,
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
            const query = gql`
                mutation deleteOrganization($input: DeleteOrganizationInput!) {
                    deleteOrganization(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: organization.id,
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

    //describe('transferOrganization', () => {
    //it('should transfer an organization', async () => {
    //const newOwner = await userRepository.create({ email: faker.internet.email() });
    //const query = gql`
    //query transferOrganization($id: String!, $ownerId: String!) {
    //transferOrganization(id: $id, ownerId: $ownerId) {
    //ownerId
    //}
    //}
    //`;

    //const variables = {
    //// FIXME: need to move to single input graphql mutations
    //id: organization.id,
    //ownerId: newOwner.id,
    //};

    //return request(app.getHttpServer())
    //.post('/graphql')
    //.send({ query, variables })
    //.expect(200)
    //.expect(({ body }) => {
    //expect(body.data.transferOrganization.ownerId).toEqual(newOwner.id);
    //});
    //});
    //});
});
