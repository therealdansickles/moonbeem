import BigNumber from 'bignumber.js';

import { faker } from '@faker-js/faker';

import { CollectionService } from '../collection/collection.service';
import { OrganizationService } from '../organization/organization.service';
import { CoinQuotes } from '../sync-chain/coin/coin.dto';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { CollaborationService } from './collaboration.service';

describe('CollaborationService', () => {
    let service: CollaborationService;
    let collectionService: CollectionService;
    let organizationService: OrganizationService;
    let userService: UserService;
    let walletService: WalletService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let coinService: CoinService;

    beforeAll(async () => {
        userService = global.userService;
        walletService = global.walletService;
        service = global.collaborationService;
        collectionService = global.collectionService;
        organizationService = global.organizationService;
        mintSaleTransactionService = global.mintSaleTransactionService;
        coinService = global.coinService;
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
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
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
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
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
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
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
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
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
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                    },
                ],
            });

            const result = await service.getCollaboration(collaboration.id);
            expect(result).toBeDefined();
            expect(result.royaltyRate).toEqual(12);
        });

        it('should not return a collaboration if id is wrong', async () => {
            const result = await service.getCollaboration(faker.string.uuid());
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
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
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
                owner: user,
            });
            const newUser = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
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
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
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
                owner: user,
            });

            const newUser = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
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
                        rate: parseInt(faker.string.numeric({ length: 2, allowLeadingZeros: false })),
                    },
                ],
            });

            const result = await service.getCollaborationsByOrganizationId(organization.id);

            result.forEach((collaboration) => {
                expect(collaboration.organization.id).toEqual(organization.id);
            });
        });
    });

    describe('getCollaborationWithEarnings', () => {
        it('should return collaborators and null earnings(if collection is not provided)', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: `arb:${faker.finance.ethereumAddress()}`,
                ownerId: user.id,
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
                owner: user,
            });

            const address1 = faker.finance.ethereumAddress();
            const address2 = faker.finance.ethereumAddress();

            const collaborators = [
                {
                    address: address1,
                    role: faker.finance.accountName(),
                    name: faker.finance.accountName(),
                    rate: 20,
                },
                {
                    address: address2,
                    role: faker.finance.accountName(),
                    name: faker.finance.accountName(),
                    rate: 80,
                },
            ];

            const collaboration = await service.createCollaboration({
                walletId: wallet.id,
                organizationId: organization.id,
                userId: user.id,
                royaltyRate: 12,
                collaborators,
            });

            const result = await service.getCollaborationWithEarnings(collaboration.id);
            expect(result.id).toBe(collaboration.id);
            expect(result.royaltyRate).toBe(12);

            const collaboratorResult = result.collaborators;
            expect(collaboratorResult).toBeDefined();
            expect(collaborators.length).toBe(2);
            collaboratorResult.sort((a, b) => a.rate - b.rate);

            expect(collaboratorResult[0].address).toBe(address1);
            expect(collaboratorResult[0].rate).toBe(20);
            expect(collaboratorResult[0].earnings).not.toBeDefined();

            expect(collaboratorResult[1].address).toBe(address2);
            expect(collaboratorResult[1].rate).toBe(80);
            expect(collaboratorResult[1].earnings).not.toBeDefined();
        });

        it('should return a collaboration with its zero earnings if no mint sale', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: `arb:${faker.finance.ethereumAddress()}`,
                ownerId: user.id,
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
                owner: user,
            });

            const address1 = faker.finance.ethereumAddress();
            const address2 = faker.finance.ethereumAddress();

            const collaborators = [
                {
                    address: address1,
                    role: faker.finance.accountName(),
                    name: faker.finance.accountName(),
                    rate: 20,
                },
                {
                    address: address2,
                    role: faker.finance.accountName(),
                    name: faker.finance.accountName(),
                    rate: 80,
                },
            ];

            const collaboration = await service.createCollaboration({
                walletId: wallet.id,
                organizationId: organization.id,
                userId: user.id,
                royaltyRate: 12,
                collaborators,
            });

            const collection = await collectionService.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: { id: organization.id },
                collaboration: { id: collaboration.id },
                tiers: [],
            });

            const result = await service.getCollaborationWithEarnings(collaboration.id, collection.id);
            expect(result).toBeDefined();
            expect(result.collaborators).toBeDefined();
            expect(result.collaborators.length).toBe(2);
            const collaboratorResult = result.collaborators;
            collaboratorResult.sort((a, b) => a.rate - b.rate);

            expect(collaboratorResult[0].earnings).toBeDefined();
            expect(collaboratorResult[0].earnings.inPaymentToken).toBe('0');
            expect(collaboratorResult[0].earnings.inUSDC).toBe('0');
            expect(collaboratorResult[0].earnings.paymentToken).toBe('');
        });
        it('should return a collaboration with individual collaborator earnings', async () => {
            const user = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });

            const wallet = await walletService.createWallet({
                address: `arb:${faker.finance.ethereumAddress()}`,
                ownerId: user.id,
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
                owner: user,
            });

            const address1 = faker.finance.ethereumAddress();
            const address2 = faker.finance.ethereumAddress();

            const collaborators = [
                {
                    address: address1,
                    role: faker.finance.accountName(),
                    name: faker.finance.accountName(),
                    rate: 20,
                },
                {
                    address: address2,
                    role: faker.finance.accountName(),
                    name: faker.finance.accountName(),
                    rate: 80,
                },
            ];

            const collaboration = await service.createCollaboration({
                walletId: wallet.id,
                organizationId: organization.id,
                userId: user.id,
                royaltyRate: 12,
                collaborators,
            });

            const collection = await collectionService.createCollectionWithTiers({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                organization: { id: organization.id },
                collaboration: { id: collaboration.id },
                tiers: [],
            });

            const coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: coin.address,
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getCollaborationWithEarnings(collaboration.id, collection.id);
            expect(result).toBeDefined();
            const collaboratorResult = result.collaborators;
            collaboratorResult.sort((a, b) => a.rate - b.rate);

            const address1Earning = new BigNumber('1000000000000000000')
                .multipliedBy(20) // rate
                .div(100)
                .div(new BigNumber(10).pow(coin.decimals)); // coin decimals

            expect(collaboratorResult[0].earnings).toBeDefined();
            expect(collaboratorResult[0].earnings.inPaymentToken).toBe(address1Earning.toString());
            expect(collaboratorResult[0].earnings.inUSDC).toBe(address1Earning.multipliedBy(tokenPriceUSD).toString());
            expect(collaboratorResult[0].earnings.paymentToken).toBe(coin.address.toLowerCase());

            const address2Earning = new BigNumber('1000000000000000000')
                .multipliedBy(80) // rate
                .div(100)
                .div(new BigNumber(10).pow(coin.decimals)); // coin decimals
            expect(collaboratorResult[1].earnings).toBeDefined();
            expect(collaboratorResult[1].earnings.inPaymentToken).toBe(address2Earning.toString());
            expect(collaboratorResult[1].earnings.inUSDC).toBe(address2Earning.multipliedBy(tokenPriceUSD).toString());
            expect(collaboratorResult[1].earnings.paymentToken).toBe(coin.address.toLowerCase());
        });
    });
});
