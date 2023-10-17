import { ethers } from 'ethers';
import { GraphQLError } from 'graphql';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { CollectionService } from '../collection/collection.service';
import { CollectionPluginService } from '../collectionPlugin/collectionPlugin.service';
import { OrganizationService } from '../organization/organization.service';
import { Plugin } from '../plugin/plugin.entity';
import { createOrganization } from '../test-utils';
import { UserService } from '../user/user.service';
import { Redeem } from './redeem.entity';
import { RedeemService } from './redeem.service';

describe('RedeemService', () => {
    let repository: Repository<Redeem>;
    let pluginRepository: Repository<Plugin>;
    let service: RedeemService;
    let userService: UserService;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;
    let collectionPluginService: CollectionPluginService;

    beforeAll(async () => {
        repository = global.redeemRepository;
        pluginRepository = global.pluginRepository;
        service = global.redeemService;
        userService = global.userService;
        organizationService = global.organizationService;
        collectionService = global.collectionService;
        collectionPluginService = global.collectionPluginService;
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

            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const collectionPlugin1 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection1.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
            });

            const collectionPlugin2 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection2.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
            });

            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await randomWallet.signMessage(message);

            const redeem1 = await service.createRedeem({
                collection: { id: collection1.id },
                collectionPluginId: collectionPlugin1.id,
                tokenId: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
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
                collectionPluginId: collectionPlugin2.id,
                tokenId: faker.string.numeric({ length: 1, allowLeadingZeros: false }),
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

            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const collectionPlugin1 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection1.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
            });

            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await randomWallet.signMessage(message);

            const redeem1 = await service.createRedeem({
                collection: { id: collection1.id },
                collectionPluginId: collectionPlugin1.id,
                tokenId: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
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
                tokenId: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
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
                tokenId: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
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
                tokenId: faker.string.numeric({ length: 2, allowLeadingZeros: false }),
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

    describe('getRedeemOverview', () => {
        it('should get redeem overview', async () => {
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

            const anotherCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const totalRecipients1 = Math.floor(Math.random() * 300);
            const collectionPlugin1 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
                pluginDetail: {
                    recipients: new Array(totalRecipients1).fill('0'),
                },
            });

            const totalRecipients2 = Math.floor(Math.random() * 500);
            const collectionPlugin2 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
                pluginDetail: {
                    recipients: new Array(totalRecipients2).fill('0'),
                },
            });

            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await randomWallet.signMessage(message);

            const tokenId1 = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            await service.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin1.id,
                tokenId: tokenId1,
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
            const tokenId2 = faker.string.numeric({ length: 2, allowLeadingZeros: false });
            await service.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin1.id,
                tokenId: tokenId2,
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
            const tokenId3 = faker.string.numeric({ length: 3, allowLeadingZeros: false });
            await service.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin1.id,
                tokenId: tokenId3,
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

            const tokenId4 = faker.string.numeric({ length: 4, allowLeadingZeros: false });
            await service.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin2.id,
                tokenId: tokenId4,
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

            const tokenId5 = faker.string.numeric({ length: 5, allowLeadingZeros: false });
            await service.createRedeem({
                collection: { id: anotherCollection.id },
                collectionPluginId: collectionPlugin2.id,
                tokenId: tokenId5,
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

            const result = await service.getRedeemOverview(collection.id);
            expect(result.length).toEqual(2);
            expect(result.find((item) => item.recipientsTotal === totalRecipients1).tokenIds.length).toEqual(3);
            expect(result.find((item) => item.recipientsTotal === totalRecipients2).tokenIds.length).toEqual(1);
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

            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const collectionPlugin1 = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
            });

            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await randomWallet.signMessage(message);

            const result = await service.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin1.id,
                tokenId: faker.string.numeric({ length: 1, allowLeadingZeros: false }),
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

        it('should throw an error if try to do a repeat one', async () => {
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

            const plugin = await pluginRepository.save({
                name: faker.commerce.productName(),
                description: faker.commerce.productDescription(),
                type: 'plugin',
            });

            const collectionPlugin = await collectionPluginService.createCollectionPlugin({
                collectionId: collection.id,
                pluginId: plugin.id,
                name: faker.commerce.productName(),
            });

            const randomWallet = ethers.Wallet.createRandom();
            const message = 'claim a redeem font';
            const signature = await randomWallet.signMessage(message);

            const tokenId = faker.string.numeric({ length: 1, allowLeadingZeros: false });
            await service.createRedeem({
                collection: { id: collection.id },
                collectionPluginId: collectionPlugin.id,
                tokenId,
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

            try {
                await service.createRedeem({
                    collection: { id: collection.id },
                    collectionPluginId: collectionPlugin.id,
                    tokenId,
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
            } catch (error) {
                expect((error as GraphQLError).message).toEqual('This token has already been redeemed.');
            }
        });
    });
});
