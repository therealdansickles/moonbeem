import { ethers } from 'ethers';
import { faker } from '@faker-js/faker';
import { CollectionService } from '../collection/collection.service';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { RedeemService } from './redeem.service';

describe('RedeemService', () => {
    let service: RedeemService;
    let userService: UserService;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;

    beforeAll(async () => {
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

            const redeem1 = await service.createRedeem({
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
