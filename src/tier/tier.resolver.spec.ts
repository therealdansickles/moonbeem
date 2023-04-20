import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';

import { Collection, CollectionKind } from '../collection/collection.entity';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { Tier } from './tier.entity';
import { TierModule } from './tier.module';
import { TierService } from './tier.service';

export const gql = String.raw;

describe('TierResolver', () => {
    let app: INestApplication;
    let repository: Repository<Tier>;
    let service: TierService;
    let collection: Collection;
    let collectionService: CollectionService;
    let tier: Tier;

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
                CollectionModule,
                TierModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [CollectionModule, TierModule],
                }),
            ],
        }).compile();

        repository = module.get('TierRepository');
        service = module.get<TierService>(TierService);
        collectionService = module.get<CollectionService>(CollectionService);

        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Tier" CASCADE');
        await repository.query('TRUNCATE TABLE "Collection" CASCADE');
        await app.close();
    });

    describe('tier', () => {
        it('should return a tier', async () => {
            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });
            tier = await service.createTier({
                name: faker.company.name(),
                collectionId: collection.id,
                totalMints: 10,
            });

            const query = gql`
                query GetTier($id: String!) {
                    tier(id: $id) {
                        id
                        name
                    }
                }
            `;

            const variables = {
                id: tier.id,
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.tier.id).toBe(tier.id);
                    expect(body.data.tier.name).toBe(tier.name);
                });
        });
    });

    describe('updateTier', () => {
        it('should update a tier', async () => {
            const query = gql`
                mutation UpdateTier($input: UpdateTierInput!) {
                    updateTier(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: tier.id,
                    name: faker.company.name(),
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.updateTier).toBeTruthy();
                });
        });
    });

    describe('deleteTier', () => {
        it('should delete a tier', async () => {
            const query = gql`
                mutation DeleteTier($input: DeleteTierInput!) {
                    deleteTier(input: $input)
                }
            `;

            const variables = {
                input: {
                    id: tier.id,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.deleteTier).toBeTruthy();
                });
        });
    });
});
