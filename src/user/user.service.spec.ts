import { GraphQLError } from 'graphql';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { Collection } from '../collection/collection.dto';
import { CollectionService } from '../collection/collection.service';
import { Organization } from '../organization/organization.dto';
import { OrganizationService } from '../organization/organization.service';
import { Coin, CoinQuotes } from '../sync-chain/coin/coin.dto';
import { CoinService } from '../sync-chain/coin/coin.service';
import {
    MintSaleTransactionService
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { Wallet } from '../wallet/wallet.dto';
import { WalletService } from '../wallet/wallet.service';
import { User } from './user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
    let service: UserService;
    let repository: Repository<User>;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;
    let walletService: WalletService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let basicUser: User;
    let coinService: CoinService;

    beforeAll(async () => {
        service = global.userService;
        repository = global.userRepository;
        organizationService = global.organizationService;
        collectionService = global.collectionService;
        walletService = global.walletService;
        mintSaleTransactionService = global.mintSaleTransactionService;
        coinService = global.coinService;

        jest.spyOn(global.mailService, 'sendWelcomeEmail').mockImplementation(async () => {});
        jest.spyOn(global.mailService, 'sendInviteEmail').mockImplementation(async () => {});
        jest.spyOn(global.mailService, 'sendPasswordResetEmail').mockImplementation(async () => {});

        basicUser = await service.createUser({
            username: faker.internet.userName(),
            email: faker.internet.email(),
            password: 'password',
        });
    });

    afterAll(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getUserByQuery', () => {
        it('should return null if no parameter provided', async () => {
            const result = await service.getUserByQuery({});
            expect(result).toBeNull();
        });

        it('should return user info by id', async () => {
            const result = await service.getUserByQuery({ id: basicUser.id });
            expect(result.username).toEqual(basicUser.username);
            expect(result.email).toEqual(basicUser.email.toLowerCase());
        });

        it('should return user info by username', async () => {
            const result = await service.getUserByQuery({ username: basicUser.username });
            expect(result.username).toEqual(basicUser.username);
            expect(result.email).toEqual(basicUser.email.toLowerCase());
        });
    });

    describe('createUser', () => {
        it('should create user', async () => {
            expect(basicUser.username).toBeDefined();
            expect(basicUser.email).toBeDefined();
            expect(basicUser.password).toBeDefined();
        });

        it('should throw error if email has been taken', async () => {
            const user = await service.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
                provider: 'local', // Specify a provider here
            });

            try {
                await service.createUser({
                    username: faker.internet.userName(),
                    email: user.email,
                    password: 'password',
                    provider: 'local', // Same provider as the initial user
                });
            } catch (error) {
                expect((error as GraphQLError).message).toBe(`This email ${user.email} is already taken.`);
            }

            try {
                await service.createUser({
                    username: faker.internet.userName(),
                    email: user.email,
                    password: 'password',
                    provider: 'another-provider', // Different provider than the initial user
                });
            } catch (error) {
                expect((error as GraphQLError).message).toBe(
                    `An account with this email already exists. Please log in with ${user.provider}.`
                );
            }
        });
    });

    describe('createUserWithOrganization', () => {
        it('should create user', async () => {
            const user = await service.createUserWithOrganization({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });
            expect(user.username).toBeDefined();
            expect(user.email).toBeDefined();
            expect(user.password).toBeDefined();

            const orgs = await organizationService.getOrganizationsByOwnerId(user.id);
            expect(orgs.length).toEqual(1);
            expect(orgs[0].owner.id).toEqual(user.id);
        });

        it('should throw error if no password is provided for local users', async () => {
            const userData = {
                username: faker.internet.userName(),
                email: faker.internet.email(),
                provider: 'local',
            };

            try {
                await service.createUserWithOrganization(userData);
            } catch (error) {
                expect((error as GraphQLError).message).toBe('Password must be provided for local users');
                expect((error as GraphQLError).extensions.code).toBe('BAD_USER_INPUT');
            }
        });

        it('should send a verification email to the new user', async () => {
            const userData = {
                username: faker.internet.userName(),
                email: faker.internet.email(),
                provider: 'local',
                password: 'password',
            };

            const sendEmailSpy = jest.spyOn(global.mailService, 'sendVerificationEmail');

            await service.createUserWithOrganization(userData);

            expect(sendEmailSpy).toHaveBeenCalled();
        });
    });

    describe('updateUser', () => {
        it('should update user info', async () => {
            const user = await repository.save({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: 'password',
            });
            const updatedUsername = faker.internet.userName();
            const updatedAvatarUrl = faker.internet.avatar();
            await service.updateUser(user.id, { username: updatedUsername, avatarUrl: updatedAvatarUrl });
            const updateUser = await repository.findOneBy({ id: user.id });
            expect(updateUser.username).toEqual(updatedUsername);
            expect(updateUser.avatarUrl).toEqual(updatedAvatarUrl);
        });
    });

    describe('authenticateUser', () => {
        it('should authenticate the user', async () => {
            const result = await service.authenticateUser(basicUser.email, 'password');
            expect(result.email).toEqual(basicUser.email.toLowerCase());
        });

        it('should return null on invalid credentials', async () => {
            const result = await service.authenticateUser(basicUser.email, 'invalidpassword');
            expect(result).toBeNull();
        });

        it('should return error if user used the email by Goole sign in', async () => {
            const email = faker.internet.email();
            const user = await service.createUser({
                username: faker.internet.userName(),
                email,
                gmail: email,
            });
            try {
                await service.authenticateUser(user.gmail, 'password');
            } catch (err) {
                expect(err.message).toEqual('This email has been used for Google sign in. Please sign in with Google.');
            }
        });

        it('should authenticate the user if gmail and password both existed', async () => {
            const email = faker.internet.email();
            const user = await service.createUser({
                username: faker.internet.userName(),
                email,
                gmail: email,
                password: 'password',
            });
            const result = await service.authenticateUser(user.gmail, 'password');
            expect(result.email).toEqual(user.email.toLowerCase());
        });
    });

    describe('verifyUser', () => {
        it('should verify the user', async () => {
            basicUser = await repository.findOneBy({ id: basicUser.id }); // reload it
            const result = await service.verifyUser(basicUser.email, basicUser.verificationToken);
            expect(result.email).toEqual(basicUser.email.toLowerCase());
            expect(result.verificationToken).toBeNull();
            expect(result.verifiedAt).toBeDefined();
        });
    });

    describe('sendPasswordResetLink', () => {
        it('should send the reset link to the user', async () => {
            const email = faker.internet.email();
            const user = await service.createUser({
                username: faker.internet.userName(),
                email,
                gmail: email,
                password: 'password',
            });
            const sendEmailSpy = jest.spyOn(global.mailService, 'sendPasswordResetEmail');
            const result = await service.sendPasswordResetLink(email);
            const foundUser = await repository.findOneBy({ id: user.id });
            expect(result).toBeTruthy();
            // There is a lowercase transformer on the email column
            // The verification token should be the one in the database
            expect(sendEmailSpy).toHaveBeenCalledWith(email.toLowerCase(), foundUser.verificationToken);
        });

        it('should throw error no user found using given email', async () => {
            const email = faker.internet.email();
            try {
                await service.sendPasswordResetLink(email);
            } catch (error) {
                expect((error as GraphQLError).message).toBe('No user registered with this email.');
                expect((error as GraphQLError).extensions.code).toBe('NO_USER_FOUND');
            }
        });
    });

    describe('resetUserPassword', () => {
        it('should reset the user password', async () => {
            const email = faker.internet.email();
            const user = await service.createUser({
                username: faker.internet.userName(),
                email,
                gmail: email,
                password: 'password',
            });
            const result = await service.resetUserPassword(user.email, user.verificationToken, 'new_password');
            expect(result.code).toEqual('SUCCESS');
        });

        it('should throw error no user found using given email and verification code', async () => {
            const email = faker.internet.email();
            const user = await service.createUser({
                username: faker.internet.userName(),
                email,
                gmail: email,
                password: 'password',
            });
            try {
                await service.resetUserPassword(user.email, 'Wrong token', 'new_password');
            } catch (error) {
                expect((error as GraphQLError).message).toBe('Invalid verification token.');
                expect((error as GraphQLError).extensions.code).toBe('INVALID_VERIFICATION_TOKEN');
            }
        });
    });

    describe('getUserProfit', () => {
        let owner: User;
        let collection: Collection;
        let coin: Coin;
        let organization: Organization;
        let wallet: Wallet;

        beforeEach(async () => {
            owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
            });
            organization = await organizationService.createOrganization({
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

            collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            coin = await coinService.createCoin({
                address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
                name: 'Wrapped Ether',
                symbol: 'WETH',
                decimals: 18,
                derivedETH: 1,
                derivedUSDC: 1,
                enabled: true,
                chainId: 1,
            });
        });

        afterEach(async () => {
            jest.clearAllMocks();
        });

        it('should return empty array, if nobody mints', async () => {
            const result = await service.getUserProfit(owner.id);
            expect(result.length).toBe(0);
        });

        it("should calculate the user's profit, multiple collections", async () => {
            // the other collection
            const collection2 = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection2.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection2.id,
                paymentToken: coin.address,
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getUserProfit(owner.id);
            expect(result.length).toBe(1);
            expect(result[0].inPaymentToken).toBe('1');
            expect(result[0].inUSDC).toBe(tokenPriceUSD.toString());
        });

        it("should calculate the user's profit", async () => {
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

            const result = await service.getUserProfit(owner.id);
            expect(result.length).toBe(1);
            expect(result[0].inPaymentToken).toBe('1');
            expect(result[0].inUSDC).toBe(tokenPriceUSD.toString());
        });
    });

    describe('getTotalCollections', () => {
        it('should be return total collections by creator. multiple collections', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });
            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection2',
                about: 'The best collection ever2',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const result = await service.getTotalCollections(owner.id);
            expect(result).toBe(2);
        });

        it('should be return total collection by creator.', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const result = await service.getTotalCollections(owner.id);
            expect(result).toBe(1);
        });

        it('should be return 0, if the user has not created a collection', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
            });
            await organizationService.createOrganization({
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

            const result = await service.getTotalCollections(owner.id);
            expect(result).toBe(0);
        });

        it('should be return 0, if the user has not bound wallet.', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const result = await service.getTotalCollections(owner.id);
            expect(result).toBe(0);
        });
    });

    describe('getUniqueBuyers', () => {
        it('should return the unique buyers. multiple collections', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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
                creator: { id: wallet.id },
            });

            const recipient1 = faker.finance.ethereumAddress();
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });
            // same recipient, should be 1
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            // the other collection
            const collection2 = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });
            // the same recipient
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection2.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection2.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getUniqueBuyers(owner.id);
            expect(result).toBe(1);

            // added another transaction
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
                paymentToken: faker.finance.ethereumAddress(),
            });
            const result1 = await service.getUniqueBuyers(owner.id);
            expect(result1).toBe(2);
        });

        it('should return the unique buyers.', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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
                creator: { id: wallet.id },
            });

            const recipient1 = faker.finance.ethereumAddress();
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });
            // same recipient, should be 1
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getUniqueBuyers(owner.id);
            expect(result).toBe(1);

            // added another transaction
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
                paymentToken: faker.finance.ethereumAddress(),
            });
            const result1 = await service.getUniqueBuyers(owner.id);
            expect(result1).toBe(2);
        });

        it('should be return 0, if the user has not created a collection', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
            });
            await organizationService.createOrganization({
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

            const result = await service.getUniqueBuyers(owner.id);
            expect(result).toBe(0);
        });

        it('should return 0, if nobody minted', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const result = await service.getUniqueBuyers(owner.id);
            expect(result).toBe(0);
        });
    });

    describe('getItemSold', () => {
        it('should return number of sales for all collections created by the user, multiple collections', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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
                creator: { id: wallet.id },
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
                paymentToken: faker.finance.ethereumAddress(),
            });

            // Records that do not match current collection
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            // the other collection
            const collection1 = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection1',
                about: 'The best collection ever1',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection1.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection1.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getItemSold(owner.id);
            expect(result).toBe(2);
        });
        it('should return number of sales for all collections created by the user', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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
                creator: { id: wallet.id },
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
                paymentToken: faker.finance.ethereumAddress(),
            });

            // Records that do not match current collection
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: faker.finance.ethereumAddress(),
            });

            const result = await service.getItemSold(owner.id);
            expect(result).toBe(1);
        });

        it('should return 0, if nobody minted', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const result = await service.getItemSold(owner.id);
            expect(result).toBe(0);
        });

        it('should return 0, if the user has not created a collection', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
            });
            await organizationService.createOrganization({
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
            const result = await service.getItemSold(owner.id);
            expect(result).toBe(0);
        });
    });

    describe('getLatestSales', () => {
        it('should return list for all collections latest sales created by the user, multiple collections', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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
                creator: { id: wallet.id },
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

            const recipient1 = faker.finance.ethereumAddress();
            const txHash = faker.string.hexadecimal({ length: 66, casing: 'lower' });
            const txTime = Math.floor(faker.date.recent().getTime() / 1000);
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash,
                txTime: txTime,
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: coin.address,
            });

            // Records that do not match current collection
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash,
                txTime: txTime,
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: coin.address,
            });

            // the other collection
            const collection1 = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection1',
                about: 'The best collection ever1',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            // the other minter
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash,
                txTime: txTime,
                sender: faker.finance.ethereumAddress(),
                recipient: faker.finance.ethereumAddress(),
                address: collection1.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection1.id,
                paymentToken: coin.address,
            });

            // the same minter
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash,
                txTime: txTime,
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection1.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection1.id,
                paymentToken: coin.address,
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getLatestSales(owner.id, '', '', 10, 10);
            expect(result.edges.length).toBe(3);
            expect(result.totalCount).toBe(3);
        });

        it('should return list for all collections latest sales created by the user', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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
                creator: { id: wallet.id },
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

            const recipient1 = faker.finance.ethereumAddress();
            const txHash = faker.string.hexadecimal({ length: 66, casing: 'lower' });
            const txTime = Math.floor(faker.date.recent().getTime() / 1000);
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash,
                txTime: txTime,
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
                address: collection.address,
                tierId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
                price: '1000000000000000000',
                collectionId: collection.id,
                paymentToken: coin.address,
            });

            // Records that do not match current collection
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: txHash,
                txTime: txTime,
                sender: faker.finance.ethereumAddress(),
                recipient: recipient1,
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

            const result = await service.getLatestSales(owner.id, '', '', 10, 10);
            expect(result.edges.length).toBe(1);
            expect(result.totalCount).toBe(1);
            expect(result.edges[0].node).toBeDefined();
            expect(result.edges[0].node.quantity).toBe(2);
            expect(result.edges[0].node.recipient).toBe(recipient1);
            expect(result.edges[0].node.collection.id).toBe(collection.id);
        });

        it('should return empth array, if user has not created collection', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
            });
            await organizationService.createOrganization({
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
            const result = await service.getLatestSales(owner.id, '', '', 10, 10);
            expect(result.edges.length).toBe(0);
            expect(result.totalCount).toBe(0);
        });

        it('should return empth array, if nobody minted', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const result = await service.getLatestSales(owner.id, '', '', 10, 10);
            expect(result.edges.length).toBe(0);
            expect(result.totalCount).toBe(0);
        });

        it('should return empth array, if the collection has not published', async () => {
            const owner = await service.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: owner.id,
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

            await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                organization: organization,
                creator: { id: wallet.id },
            });

            const result = await service.getLatestSales(owner.id, '', '', 10, 10);
            expect(result.edges.length).toBe(0);
            expect(result.totalCount).toBe(0);
        });
    });

    describe('onboardUsers', function () {
        it('should onboard users', async () => {
            const email = faker.internet.email().toLowerCase();
            const emails = [email];
            await service.onboardUsers(emails);


            const user = await repository.findOneBy({ email });
            expect(user.verificationToken).toBeDefined();

            const organization = await organizationService.getOrganizationsByOwnerId(user.id);
            expect(organization).toBeDefined();
            expect(organization.length).toEqual(1);
            expect(organization[0].owner.email).toEqual(email);
        });
    });

    describe('getPasswordResetLink', function () {
        it('should return password reset link', async () => {
            const email = faker.internet.email().toLowerCase();
            const user = await service.createUser({
                email,
                password: 'password',
            });
            const previousToken = user.verificationToken;
            const link = await service.getPasswordResetLink(user);
            const updatedUser = await service.getUserByQuery({
                id: user.id,
            });
            expect(link).toBeDefined();
            expect(link).toContain(updatedUser.verificationToken);
            expect(link).not.toContain(previousToken);
        });
    });
});
