import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { ethers } from 'ethers';

import { CollaborationModule } from '../collaboration/collaboration.module';
import { CollectionKind } from '../collection/collection.entity';
import { CollectionInput } from '../collection/collection.dto';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { MintSaleTransactionService } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { MintSaleTransactionModule } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.module';
import { MintSaleContractModule } from '../sync-chain/mint-sale-contract/mint-sale-contract.module';
import { MintSaleContractService } from '../sync-chain/mint-sale-contract/mint-sale-contract.service';
import { Tier } from '../tier/tier.entity';
import { TierService } from '../tier/tier.service';
import { TierModule } from '../tier/tier.module';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { Wallet } from './wallet.entity';
import { WalletModule } from './wallet.module';
import { WalletService } from './wallet.service';
import { MintSaleContract } from '../sync-chain/mint-sale-contract/mint-sale-contract.entity';

describe('WalletService', () => {
    let address: string;
    let repository: Repository<Wallet>;
    let contractRepository: Repository<MintSaleContract>;
    let transactionRepository: Repository<MintSaleTransaction>;
    let collectionService: CollectionService;
    let mintSaleTransactionService: MintSaleTransactionService;
    let mintSaleContractService: MintSaleContractService;
    let service: WalletService;
    let tierService: TierService;
    let userService: UserService;

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
                WalletModule,
            ],
        }).compile();

        address = faker.finance.ethereumAddress().toLowerCase();
        repository = module.get('WalletRepository');
        contractRepository = module.get('sync_chain_MintSaleContractRepository');
        transactionRepository = module.get('sync_chain_MintSaleTransactionRepository');
        service = module.get<WalletService>(WalletService);
        collectionService = module.get<CollectionService>(CollectionService);
        mintSaleTransactionService = module.get<MintSaleTransactionService>(MintSaleTransactionService);
        mintSaleContractService = module.get<MintSaleContractService>(MintSaleContractService);
        tierService = module.get<TierService>(TierService);
        userService = module.get<UserService>(UserService);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('getWallet', () => {
        it('should return a wallet by id', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress().toLowerCase() });
            const result = await service.getWallet(wallet.id);
            expect(result.id).toBeDefined();
        });
    });

    describe('getWalletByAddress', () => {
        it('should return a wallet by address', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress().toLowerCase() });
            const result = await service.getWalletByAddress(wallet.address);
            expect(result.address).toEqual(wallet.address.toLowerCase());
        });
    });

    describe('getWalletByName', () => {
        it('should return a wallet by name', async () => {
            const wallet = await service.createWallet({
                address: faker.finance.ethereumAddress().toLowerCase(),
                name: 'dogvibe',
            });
            const result = await service.getWalletByName(wallet.name);
            expect(result.name).toEqual(wallet.name);
        });
    });

    describe('createWallet', () => {
        it('should create a wallet', async () => {
            const walletAddress = faker.finance.ethereumAddress().toUpperCase();
            const result = await service.createWallet({ address: walletAddress, name: 'dog', about: 'hihi' });
            expect(result.id).toBeDefined();
            expect(result.address).toEqual(walletAddress.toLowerCase());
            expect(result.name).toEqual('dog');
            expect(result.about).toEqual('hihi');
        });

        it('should error if the wallet already exists', async () => {
            const wallet = await service.createWallet({ address });
            expect(async () => {
                await service.createWallet({ address });
            });
        });
    });

    describe('bindWallet', () => {
        let unboundWallet: Wallet;
        let eipAddress: string;
        let ownerId: string;
        let wallet: ethers.HDNodeWallet;
        let message: string;
        let signature: string;

        beforeEach(async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            wallet = ethers.Wallet.createRandom();
            message = 'Hi from tests!';
            signature = await wallet.signMessage(message);

            ownerId = owner.id;
            const unboundWallet = await service.createWallet({ address: wallet.address.toLowerCase() });
            eipAddress = unboundWallet.address.toLowerCase();
        });

        it.skip('should handle an EIP-3770 address', async () => {
            const data = { address: unboundWallet.address, owner: { id: ownerId }, message, signature };
            const result = await service.bindWallet(data);
            expect(result.owner).toEqual(ownerId);
        });

        it('should handle an existing address', async () => {
            const data = { address: eipAddress, owner: { id: ownerId }, message, signature };
            const result = await service.bindWallet(data);
            expect(result.owner.id).toEqual(ownerId);
        });

        it('should create a new wallet with given owner', async () => {
            const newWallet = ethers.Wallet.createRandom();
            const newSignature = await newWallet.signMessage(message);
            const data = { address: newWallet.address, owner: { id: ownerId }, message, signature: newSignature };
            const result = await service.bindWallet(data);
            expect(result.owner.id).toEqual(ownerId);
            expect(result.address).toEqual(newWallet.address.toLowerCase());
        });

        it('should throw an error if the wallet is already bound', async () => {
            const data = { address: eipAddress, owner: { id: ownerId }, message, signature };
            await service.bindWallet(data);
            await expect(() => service.bindWallet(data)).rejects.toThrow();
        });
    });

    describe('unbindWallet', () => {
        let boundWallet: Wallet;
        let address: string;
        let wallet: ethers.HDNodeWallet;
        let message: string;
        let signature: string;
        let owner: any;

        beforeAll(async () => {
            owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            wallet = ethers.Wallet.createRandom();
            message = 'Hi from tests!';
            signature = await wallet.signMessage(message);
            address = wallet.address.toLowerCase();

            boundWallet = await service.createWallet({ address, ownerId: owner.id });
        });

        // NB: We don't test for a regular address because that defaults to ethereum.
        // You can only use an EIP-3770 address if you are on another chain.
        it.skip('should handle an EIP-3770 address', async () => {
            const data = { address, owner: { id: boundWallet.owner.id } };
            const result = await service.unbindWallet(data);
            expect(result.owner).not.toEqual(boundWallet.owner);
            expect(result.address).toEqual(boundWallet.address.toLowerCase());
            // expect(result.chainId).toEqual(boundWallet.chainId);
        });

        it('should return a new unbound wallet if it the wallet does not exist', async () => {
            const data = { address, owner: { id: owner.id } };
            const result = await service.unbindWallet(data);
            expect(result.owner.id).not.toEqual(boundWallet.owner);
            expect(result.address).toEqual(address.toLowerCase());
            // expect(result.chainId).toEqual(42161);
        });

        it('should throw an error if the wallet is not bound to the user', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const nonOwner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const newWallet = ethers.Wallet.createRandom();
            const newSignature = await newWallet.signMessage(message);

            await service.createWallet({ address: newWallet.address });
            await service.bindWallet({
                address: newWallet.address.toLowerCase(),
                owner: { id: owner.id },
                message,
                signature: newSignature,
            });
            const data = { address: newWallet.address.toLowerCase(), owner: { id: nonOwner.id } };
            await expect(() => service.unbindWallet(data)).rejects.toThrow();
        });
    });

    describe('verifyWallet', () => {
        it('should return a valid wallet if the signature is valid', async () => {
            const wallet = ethers.Wallet.createRandom();
            const message = 'Hi from tests!';
            const signature = await wallet.signMessage(message);
            const result = await service.verifyWallet(wallet.address, message, signature);
            expect(result.address).toEqual(wallet.address.toLowerCase());
        });
    });

    describe('parseEIP3770Address', () => {
        it('parses a valid EIP-3770 address', () => {
            const input = 'eth:0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7';
            const expected: Partial<Wallet> = {
                address: '0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7',
            };
            expect(service.parseEIP3770Address(input)).toEqual(expected);
        });

        it('returns the chainId if its used in the EIP-3770 address', () => {
            const input = '52161:0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7';
            const expected: Partial<Wallet> = {
                address: '0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7',
            };
            expect(service.parseEIP3770Address(input)).toEqual(expected);
        });

        it('throws an error if the address is invalid', () => {
            const input = 'invalid:0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf';
            expect(() => service.parseEIP3770Address(input)).toThrow();
        });

        it('defaults to ethereum', () => {
            const input = '0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7';
            const expected: Partial<Wallet> = {
                address: '0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7',
            };
            expect(service.parseEIP3770Address(input)).toEqual(expected);
        });

        it('is case-insensitive for the network part', () => {
            const input = 'ETH:0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7';
            const expected: Partial<Wallet> = {
                address: '0x7cef3dbc9cb5b25f8de7f1a48fa8bcbdbe42caf7',
            };

            expect(service.parseEIP3770Address(input)).toEqual(expected);
        });
    });

    describe('getMintedByAddress', () => {
        it('should return minted transactions by address', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
            });

            const transaction = await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const [result, ...rest] = await service.getMintedByAddress(wallet.address);
            expect(result.address).toEqual(transaction.address);
            expect(result.tokenAddress).toEqual(transaction.tokenAddress);
            expect(result.paymentToken).toEqual(transaction.paymentToken);
            expect(result.tokenId).toEqual(transaction.tokenId);
            expect(result.price).toEqual(transaction.price);
            expect(result.txTime).toEqual(transaction.txTime);
            expect(result.tier.id).toEqual(tier.id);
            expect(result.tier.collection.id).toEqual(collection.id);
        });
    });

    describe('getActivitiesByAddress', () => {
        beforeEach(async () => {
            await repository.query('TRUNCATE TABLE "Wallet" CASCADE');
            await contractRepository.query('TRUNCATE TABLE "MintSaleContract" CASCADE');
            await transactionRepository.query('TRUNCATE TABLE "MintSaleTransaction" CASCADE');
        });

        it('should return minted transactions and deployed transactions by address', async () => {
            const wallet = await service.createWallet({ address: faker.finance.ethereumAddress() });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.company.name(),
                about: faker.company.name(),
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
            });

            const txTime = Math.floor(faker.date.recent().getTime() / 1000);

            const mintedTransactions = await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime,
                sender: faker.finance.ethereumAddress(),
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
            });

            const deployedTransactions = await await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: txTime + 1,
                sender: wallet.address,
                royaltyReceiver: wallet.address,
                royaltyRate: faker.random.numeric(2),
                derivativeRoyaltyRate: faker.random.numeric(2),
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().valueOf() / 1000),
                endTime: Math.floor(faker.date.future().valueOf() / 1000),
                price: faker.random.numeric(5),
                tierId: tier.tierId,
                address: collection.address,
                paymentToken: faker.finance.ethereumAddress(),
                startId: 0,
                endId: 10,
                currentId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            const list = await service.getActivitiesByAddress(wallet.address);
            const [deployItem, mintItem] = list;
            expect(list.length).toEqual(2);
            expect(deployItem.type).toEqual('Deploy');
            expect(mintItem.type).toEqual('Mint');
        });
    });

    describe('updateWallet', () => {
        it('should update wallet', async () => {
            const walletAddress = faker.finance.ethereumAddress().toLowerCase();
            const name = faker.finance.accountName();
            const result = await service.createWallet({ address: walletAddress });

            const updateResult = await service.updateWallet(result.id, { name: name });

            expect(result.id).toBeDefined();
            expect(result.address).toEqual(walletAddress.toLowerCase());
            expect(updateResult.name).toEqual(name);
        });
    });

    describe('getValueGroupByToken', () => {
        it('should return correct value', async () => {
            const sender1 = faker.finance.ethereumAddress();
            const sender2 = faker.finance.ethereumAddress();

            const wallet = await service.createWallet({ address: sender1 });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
            });

            const paymentToken = faker.finance.ethereumAddress();

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken,
            });

            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                royaltyReceiver: sender1,
                royaltyRate: faker.random.numeric(2),
                derivativeRoyaltyRate: faker.random.numeric(2),
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().valueOf() / 1000),
                endTime: Math.floor(faker.date.future().valueOf() / 1000),
                price: faker.random.numeric(5),
                tierId: tier.tierId,
                address: collection.address,
                paymentToken,
                startId: 0,
                endId: 10,
                currentId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            const records = await service.getValueGroupByToken(sender1);
            expect(records.length).toEqual(1);
            expect(records[0].token).toBeTruthy();
            expect(+records[0].price).toBeGreaterThan(0);
        });
    });

    describe('getEstimatesByAddress', () => {
        it('should return correct value', async () => {
            const sender1 = faker.finance.ethereumAddress();
            const sender2 = faker.finance.ethereumAddress();

            const wallet = await service.createWallet({ address: sender1 });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                artists: [],
                tags: [],
                kind: CollectionKind.edition,
                address: faker.finance.ethereumAddress(),
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                tierId: 1,
                collection: { id: collection.id },
                paymentTokenAddress: faker.finance.ethereumAddress(),
            });

            const paymentToken = faker.finance.ethereumAddress();

            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken,
            });
            await mintSaleTransactionService.createMintSaleTransaction({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                recipient: wallet.address,
                address: collection.address,
                tierId: tier.tierId,
                tokenAddress: faker.finance.ethereumAddress(),
                tokenId: faker.random.numeric(3),
                price: faker.random.numeric(19),
                paymentToken,
            });

            await mintSaleContractService.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: sender1,
                royaltyReceiver: sender1,
                royaltyRate: faker.random.numeric(2),
                derivativeRoyaltyRate: faker.random.numeric(2),
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().valueOf() / 1000),
                endTime: Math.floor(faker.date.future().valueOf() / 1000),
                price: faker.random.numeric(5),
                tierId: tier.tierId,
                address: collection.address,
                paymentToken,
                startId: 0,
                endId: 10,
                currentId: 0,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            const estimatedValue = await service.getEstimatesByAddress(sender1);
            expect(+estimatedValue[0].total).toBeGreaterThan(0);
        });
    });
});
