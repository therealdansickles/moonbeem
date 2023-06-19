import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { ethers } from 'ethers';

import { UserService } from '../user/user.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';

import { CollectionService } from '../collection/collection.service';
import { RelationshipService } from '../relationship/relationship.service';
import { SessionModule } from '../session/session.module';
import { SessionService } from '../session/session.service';
import { RedeemModule } from './redeem.module';
import { RedeemService } from './redeem.service';
import { OrganizationService } from '../organization/organization.service';
import { INestApplication } from '@nestjs/common';

export const gql = String.raw;

describe('RedeemResolver', () => {
    let service: RedeemService;
    let userService: UserService;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;
    let app: INestApplication;

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
                RedeemModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [RedeemModule],
                }),
                SessionModule,
            ],
        }).compile();

        service = module.get<RedeemService>(RedeemService);
        userService = module.get<UserService>(UserService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        collectionService = module.get<CollectionService>(CollectionService);
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('createRedeem', () => {
        it('should create a redeem', async () => {
            const owner = await userService.createUser({
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
                owner: owner,
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const query = gql`
                mutation CreateRedeem($input: CreateRedeemInput!) {
                    createRedeem(input: $input) {
                        id
                        deliveryAddress
                        email
                    }
                }
            `;

            const variables = {
                input: {
                    deliveryAddress: faker.address.streetAddress(),
                    email: faker.internet.email(),
                    collection: { id: collection.id },
                    tokenId: +faker.random.numeric(1),
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.createRedeem.id).toBeTruthy();
                    expect(body.data.createRedeem.deliveryAddress).toEqual(variables.input.deliveryAddress);
                });
        });
    });

});
