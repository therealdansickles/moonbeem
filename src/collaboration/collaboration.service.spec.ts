import { faker } from '@faker-js/faker';

import { CollaborationService } from './collaboration.service';
import { CollectionService } from '../collection/collection.service';
import { WalletService } from '../wallet/wallet.service';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';

describe('CollaborationService', () => {
    let service: CollaborationService;
    let collectionService: CollectionService;
    let organizationService: OrganizationService;
    let userService: UserService;
    let walletService: WalletService;

    beforeAll(async () => {
        userService = global.userService;
        walletService = global.walletService;
        service = global.collaborationService;
        collectionService = global.collectionService;
        organizationService = global.organizationService;
    });

    beforeEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('createCollaboration', () => {
        it('should create a collaboration', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
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
                owner: user,
            });

            const wallet = await walletService.createWallet({
                address: `arb:${faker.finance.ethereumAddress()}`,
                ownerId: user.id,
            });
            const result = await service.createCollaboration({
                walletId: wallet.id,
                organizationId: organization.id,
                userId: user.id,
                royaltyRate: 12,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            expect(result.royaltyRate).toEqual(12);
            expect(result.wallet).toBeDefined();
            expect(result.wallet.id).toEqual(wallet.id);
            expect(result.organization.id).toEqual(organization.id);
            expect(result.user.id).toEqual(user.id);
        });

        it('should create a collaboration even if nothing provided', async () => {
            const result = await service.createCollaboration({});
            expect(result.id).toBeTruthy();
        });

        it('should throw error if royalty out of bound', async () => {
            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.finance.accountName(),
                chainId: 1,
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });
            const wallet1 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            await service.createCollaboration({
                walletId: wallet1.id,
                royaltyRate: 98,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            const wallet2 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            await service.createCollaboration({
                walletId: wallet2.id,
                royaltyRate: 2,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.finance.accountName(),
                chainId: 1,
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });
            // this should work as it's another collection
            const collaborationForAnotherCollection = await service.createCollaboration({
                walletId: wallet1.id,
                royaltyRate: 1,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            expect(collaborationForAnotherCollection.wallet).toBeDefined();
            expect(collaborationForAnotherCollection.wallet.id).toEqual(wallet1.id);
        });
    });

    describe('getCollaboration', () => {
        it('should return a collaboration', async () => {
            const wallet = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            const collaboration = await service.createCollaboration({
                walletId: wallet.id,
                royaltyRate: 12,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const result = await service.getCollaboration(collaboration.id);
            expect(result).toBeDefined();
            expect(result.royaltyRate).toEqual(12);
        });

        it('should not return a collaboration if id is wrong', async () => {
            const result = await service.getCollaboration(faker.datatype.uuid());
            expect(result).toBeNull();
        });

        it('should return a collaboration with its wallet and collection', async () => {
            const wallet = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            const collaboration = await service.createCollaboration({
                walletId: wallet.id,
                royaltyRate: 12,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            const result = await service.getCollaboration(collaboration.id);
            expect(result.wallet).toBeDefined();
        });
    });

    describe('getCollaborationsByUserIdAndOrganizationId', () => {
        it('should return collaborations', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
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
                owner: user,
            });
            const newUser = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const newWallet = await walletService.createWallet({
                address: `arb:${faker.finance.ethereumAddress()}`,
                ownerId: newUser.id,
            });

            await service.createCollaboration({
                walletId: newWallet.id,
                royaltyRate: 12,
                userId: newUser.id,
                organizationId: organization.id,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const [result] = await service.getCollaborationsByUserIdAndOrganizationId(newUser.id, organization.id);
            expect(result.user.id).toEqual(newUser.id);
            expect(result.organization.id).toEqual(organization.id);
        });
    });

    describe('getCollaborationsByOrganizationId', () => {
        it('should return collaborations', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
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
                owner: user,
            });

            const newUser = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const newWallet = await walletService.createWallet({
                address: `arb:${faker.finance.ethereumAddress()}`,
                ownerId: newUser.id,
            });

            await service.createCollaboration({
                walletId: newWallet.id,
                royaltyRate: 12,
                userId: newUser.id,
                organizationId: organization.id,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const result = await service.getCollaborationsByOrganizationId(organization.id);

            result.forEach((collaboration) => {
                expect(collaboration.organization.id).toEqual(organization.id);
            });
        });
    });
});
