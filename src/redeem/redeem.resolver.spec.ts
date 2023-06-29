import * as request from 'supertest';

import { Test, TestingModule } from '@nestjs/testing';

import { ApolloDriver } from '@nestjs/apollo';
import { Asset721Module } from '../sync-chain/asset721/asset721.module';
import { Asset721Service } from '../sync-chain/asset721/asset721.service';
import { CollectionService } from '../collection/collection.service';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { OrganizationService } from '../organization/organization.service';
import { RedeemModule } from './redeem.module';
import { SessionModule } from '../session/session.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from '../user/user.service';
import { ethers } from 'ethers';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

export const gql = String.raw;

describe('RedeemResolver', () => {
    let userService: UserService;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;
    let mintSaleContractService: MintSaleContractService;
    let asset721Service: Asset721Service;
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
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [RedeemModule],
                }),
                SessionModule,
                Asset721Module,
                RedeemModule,
            ],
        }).compile();

        userService = module.get<UserService>(UserService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        collectionService = module.get<CollectionService>(CollectionService);
        mintSaleContractService = module.get<MintSaleContractService>(MintSaleContractService);
        asset721Service = module.get<Asset721Service>(Asset721Service);
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('createRedeem', () => {

        it('should forbid if signature not matched', async () => {
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

            const trueWallet = ethers.Wallet.createRandom();
            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await trueWallet.signMessage(message);

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
                    address: randomWallet.address,
                    message,
                    signature,
                    deliveryAddress: faker.address.streetAddress(),
                    deliveryCity: faker.address.city(),
                    deliveryZipcode: faker.address.zipCode(),
                    deliveryState: faker.address.state(),
                    deliveryCountry: faker.address.country(),
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
                    expect(body.errors).toBeTruthy();
                    expect(body.data).toBeFalsy();
                });
        });

        it('should forbid if owner of the asset721 doesn\'t match the signed wallet', async () => {
            const ownerUser = await userService.createUser({
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
                owner: ownerUser,
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

            const mintSaleContract = await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress().toLowerCase(),
                address: faker.finance.ethereumAddress().toLowerCase(),
                royaltyReceiver: faker.finance.ethereumAddress().toLowerCase(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress().toLowerCase(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress().toLowerCase(),
                collectionId: collection.id,
            })

            const ownerWallet = ethers.Wallet.createRandom();
            const ownerWallet2 = ethers.Wallet.createRandom();
            const tokenId = faker.random.numeric(1);

            const asset = await asset721Service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: mintSaleContract.tokenAddress,
                tokenId,
                owner: ownerWallet2.address,
            })

            const message = 'claim a redeem font';
            const signature = await ownerWallet.signMessage(message);

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
                    address: ownerWallet.address,
                    message,
                    signature,
                    deliveryAddress: faker.address.streetAddress(),
                    deliveryCity: faker.address.city(),
                    deliveryZipcode: faker.address.zipCode(),
                    deliveryState: faker.address.state(),
                    deliveryCountry: faker.address.country(),
                    email: faker.internet.email(),
                    collection: { id: collection.id },
                    tokenId: +tokenId,
                },
            };

            return request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.errors).toBeTruthy();
                    expect(body.data).toBeFalsy();
                });
        })

        it('should create a redeem', async () => {
            const ownerUser = await userService.createUser({
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
                owner: ownerUser,
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

            const ownerWallet = ethers.Wallet.createRandom();
            const tokenId = faker.random.numeric(1);

            const mintSaleContract = await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress().toLowerCase(),
                address: faker.finance.ethereumAddress().toLowerCase(),
                royaltyReceiver: faker.finance.ethereumAddress().toLowerCase(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress().toLowerCase(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress().toLowerCase(),
                collectionId: collection.id,
            });

            const asset = await asset721Service.createAsset721({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: mintSaleContract.tokenAddress,
                tokenId,
                owner: ownerWallet.address,
            });

            const message = 'claim a redeem font';
            const signature = await ownerWallet.signMessage(message);

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
                    address: ownerWallet.address,
                    message,
                    signature,
                    deliveryAddress: faker.address.streetAddress(),
                    deliveryCity: faker.address.city(),
                    deliveryZipcode: faker.address.zipCode(),
                    deliveryState: faker.address.state(),
                    deliveryCountry: faker.address.country(),
                    email: faker.internet.email(),
                    collection: { id: collection.id },
                    tokenId: +tokenId,
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
