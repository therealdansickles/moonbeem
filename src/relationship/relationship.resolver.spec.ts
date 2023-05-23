import * as request from 'supertest';
import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ethers } from 'ethers';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { RelationshipService } from "./relationship.service";
import { RelationshipModule } from "./relationship.module";
import { WalletService } from "../wallet/wallet.service";
import { Relationship } from './relationship.dto';
import { WalletModule } from "../wallet/wallet.module";

export const gql = String.raw;

describe('RelationshipResolver', () => {
    let service: RelationshipService;
    let walletService: WalletService;
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
                }),
                RelationshipModule,
                WalletModule,
                GraphQLModule.forRoot({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    include: [RelationshipModule],
                }),
            ],
        }).compile();

        service = module.get<RelationshipService>(RelationshipService);
        walletService = module.get<WalletService>(WalletService);
        app = module.createNestApplication();
        await app.init();
    });

    afterAll(async () => {
        global.gc && global.gc();
        await app.close();
    });

    describe('createRelationship', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            const query = gql`
                mutation FollowByAddress($input: CreateRelationshipByAddressInput!) {
                    followByAddress(input: $input) {
                        id
                        follower {
                            address
                        }
                        following {
                            address
                        }
                    }
                }
            `;

            const variables = {
                input: {
                    followerAddress: wallet2.address,
                    followingAddress: wallet1.address
                },
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.followByAddress.id).toBeTruthy()
                    expect(body.data.followByAddress.follower.address).toEqual(wallet2.address.toLowerCase());
                    expect(body.data.followByAddress.following.address).toEqual(wallet1.address.toLowerCase());
                });
        });
    });

    describe('getFollowers', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await service.createRelationshipByAddress({ followingAddress: wallet1.address, followerAddress: wallet2.address });
            await service.createRelationshipByAddress({ followingAddress: wallet1.address, followerAddress: wallet3.address });

            const query = gql`
                query followers($address: String!) {
                    followers(address: $address) {
                        id
                        follower {
                            id
                            address
                        }
                    }
                }
            `;

            const variables = {
                address: wallet1.address,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.followers.length).toEqual(2);
                    expect(body.data.followers[0].follower.address).toEqual(wallet2.address);
                    expect(body.data.followers[1].follower.address).toEqual(wallet3.address);
                });
        })
    })

    describe('getFollowings', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await service.createRelationshipByAddress({ followingAddress: wallet1.address, followerAddress: wallet2.address });
            await service.createRelationshipByAddress({ followingAddress: wallet1.address, followerAddress: wallet3.address });

            const query = gql`
                query followings($address: String!) {
                    followings(address: $address) {
                        id
                        following {
                            id
                            address
                        }
                    }
                }
            `;

            const variables = {
                address: wallet2.address,
            };

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(200)
                .expect(({ body }) => {
                    expect(body.data.followings.length).toEqual(1);
                    expect(body.data.followings[0].following.address).toEqual(wallet1.address);
                });
        })
    })
});
