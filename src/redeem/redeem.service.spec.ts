import { ethers } from 'ethers';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { CollectionService } from '../collection/collection.service';
import { OrganizationService } from '../organization/organization.service';
import { createOrganization } from '../test-utils';
import { UserService } from '../user/user.service';
import { Redeem } from './redeem.entity';
import { RedeemService } from './redeem.service';

describe('RedeemService', () => {
    let repository: Repository<Redeem>;
    let service: RedeemService;
    let userService: UserService;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;

    beforeAll(async () => {
        repository = global.redeemRepository;
        service = global.redeemService;
        userService = global.userService;
        organizationService = global.organizationService;
        collectionService = global.collectionService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getRedeemByQuery', () => {
        it('should get redeem', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, {
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

            const redeem1 = await service.createRedeem({
                collection: { id: collection1.id },
                tokenId: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
                message,
                signature,
            });

            const redeem2 = await service.createRedeem({
                collection: { id: collection2.id },
                tokenId: parseInt(faker.string.numeric({ length: 1, allowLeadingZeros: false })),
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
                message,
                signature,
            });

            const resultForRedeem1Query = await service.getRedeemByQuery({
                collection: { id: collection1.id },
                tokenId: redeem1.tokenId + 1,
            });
            expect(resultForRedeem1Query).toBeNull();
            const resultForRedemm2Query = await service.getRedeemByQuery({
                collection: { id: collection2.id },
                tokenId: redeem2.tokenId,
            });
            expect(resultForRedemm2Query.id).toEqual(redeem2.id);
        });
    });

    describe('getRedeems', () => {
        it('should get redeems', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, {
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

            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await randomWallet.signMessage(message);

            const redeem1 = await service.createRedeem({
                collection: { id: collection1.id },
                tokenId: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
                message,
                signature,
            });

            const result = await service.getRedeems({
                collection: { id: collection1.id },
                address: randomWallet.address,
            });
            expect(result).toBeTruthy();
            expect(result.length).toEqual(1);
            expect(result[0].id).toEqual(redeem1.id);
        });

        it('should get redeemed records by `isRedeemed` state', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, {
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

            const randomWallet = ethers.Wallet.createRandom();

            const redeem1 = await repository.save({
                collection: { id: collection1.id },
                tokenId: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
                isRedeemed: false,
            });

            const redeem2 = await repository.save({
                collection: { id: collection1.id },
                tokenId: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
                isRedeemed: true,
            });

            // a record who will use the default value for `isRedeemed`
            await repository.save({
                collection: { id: collection1.id },
                tokenId: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
            });

            const result1 = await service.getRedeems({
                collection: { id: collection1.id },
                address: randomWallet.address,
                isRedeemed: false,
            });
            expect(result1).toBeTruthy();
            expect(result1.length).toEqual(2);
            expect(result1.map((item) => item.id).find((item) => item === redeem1.id)).toBeTruthy();

            const result2 = await service.getRedeems({
                collection: { id: collection1.id },
                address: randomWallet.address,
                isRedeemed: true,
            });
            expect(result2).toBeTruthy();
            expect(result2.length).toEqual(1);
            expect(result2[0].id).toEqual(redeem2.id);

            const result = await service.getRedeems({
                collection: { id: collection1.id },
                address: randomWallet.address,
            });
            expect(result).toBeTruthy();
            expect(result.length).toEqual(3);
        });
    });

    describe('createRedeem', () => {
        it('should create redeem', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(organizationService, {
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
                tokenId: parseInt(faker.string.numeric({ length: 1, allowLeadingZeros: false })),
                deliveryAddress: faker.location.streetAddress(),
                deliveryCity: faker.location.city(),
                deliveryZipcode: faker.location.zipCode(),
                deliveryState: faker.location.state(),
                deliveryCountry: faker.location.country(),
                email: faker.internet.email(),
                address: randomWallet.address,
                message,
                signature,
            });
            expect(result.collection).toEqual(collection.id);
        });
    });
});
