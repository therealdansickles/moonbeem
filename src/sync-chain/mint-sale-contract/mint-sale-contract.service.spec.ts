import { faker } from '@faker-js/faker';

import { CollectionService } from '../../collection/collection.service';
import { OrganizationService } from '../../organization/organization.service';
import { UserService } from '../../user/user.service';
import { MintSaleContractService } from './mint-sale-contract.service';

describe('MintSaleContractService', () => {
    let service: MintSaleContractService;
    let collectionService: CollectionService;
    let userService: UserService;
    let organizationService: OrganizationService;

    beforeAll(async () => {
        service = global.mintSaleContractService;
        collectionService = global.collectionService;
        userService = global.userService;
        organizationService = global.organizationService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('MintSaleContract', () => {
        it('should get an contract', async () => {
            const contract = await service.createMintSaleContract({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.string.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            const result = await service.getMintSaleContract(contract.id);
            expect(result.id).toEqual(contract.id);
        });
    });

    describe('getMintSaleContractByCollection', () => {
        it('should return a contract, if one exists', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
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

            const contract = await service.createMintSaleContract({
                height: parseInt(faker.string.numeric(5)),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.string.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                collectionId: collection.id,
            });

            const result = await service.getMintSaleContractByCollection(collection.id);
            expect(result).toBeDefined();
            expect(result.id).toEqual(contract.id);
        });

        it('should return null for contract, if no contract exists', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await organizationService.createOrganization({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.catchPhrase(),
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
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

            const result = await service.getMintSaleContractByCollection(collection.id);
            expect(result).toBe(null);
        });
    });
});
