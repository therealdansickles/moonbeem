import { ethers } from 'ethers';

import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { postgresConfig } from '../lib/configs/db.config';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationService } from '../organization/organization.service';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { RedeemModule } from './redeem.module';
import { RedeemService } from './redeem.service';

describe('RedeemService', () => {
    let service: RedeemService;
    let userService: UserService;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;

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
                UserModule,
                OrganizationModule,
                CollectionModule,
            ],
        }).compile();

        service = module.get<RedeemService>(RedeemService);
        userService = module.get<UserService>(UserService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        collectionService = module.get<CollectionService>(CollectionService);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('getRedeemByQuery', () => {
        it('should get redeem', async () => {
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

            const collection1 = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const collection2 = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await randomWallet.signMessage(message);

            const redeem1 =  await service.createRedeem({
                collection: { id: collection1.id },
                tokenId: parseInt(faker.random.numeric(2)),
                deliveryAddress: faker.address.streetAddress(),
                deliveryCity: faker.address.city(),
                deliveryZipcode: faker.address.zipCode(),
                deliveryState: faker.address.state(),
                deliveryCountry: faker.address.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
                message,
                signature,
            });

            const redeem2 = await service.createRedeem({
                collection: { id: collection2.id },
                tokenId: parseInt(faker.random.numeric(1)),
                deliveryAddress: faker.address.streetAddress(),
                deliveryCity: faker.address.city(),
                deliveryZipcode: faker.address.zipCode(),
                deliveryState: faker.address.state(),
                deliveryCountry: faker.address.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
                message,
                signature,
            });

            const resultForRedeem1Query = await service.getRedeemByQuery({ collection: { id: collection1.id }, tokenId: redeem1.tokenId + 1 });
            expect(resultForRedeem1Query).toBeNull();
            const resultForRedemm2Query = await service.getRedeemByQuery({ collection: { id: collection2.id }, tokenId: redeem2.tokenId });
            expect(resultForRedemm2Query.id).toEqual(redeem2.id);
        });
    });

    describe('createRedeem', () => {
        it('should create redeem', async () => {
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

            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await randomWallet.signMessage(message);

            const result = await service.createRedeem({
                collection: { id: collection.id },
                tokenId: parseInt(faker.random.numeric(1)),
                deliveryAddress: faker.address.streetAddress(),
                deliveryCity: faker.address.city(),
                deliveryZipcode: faker.address.zipCode(),
                deliveryState: faker.address.state(),
                deliveryCountry: faker.address.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
                message,
                signature,
            });
            expect(result.collection).toEqual(collection.id);
        });
    });

});
