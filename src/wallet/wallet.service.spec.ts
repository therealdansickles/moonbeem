import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { Wallet } from './wallet.entity';
import { WalletModule } from './wallet.module';
import { WalletService } from './wallet.service';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { ethers } from 'ethers';

describe('WalletService', () => {
    let repository: Repository<Wallet>;
    let service: WalletService;
    let userService: UserService;
    let address: string;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    url: postgresConfig.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                WalletModule,
                CollaborationModule,
                UserModule,
            ],
        }).compile();

        address = faker.finance.ethereumAddress().toLowerCase();
        repository = module.get('WalletRepository');
        service = module.get<WalletService>(WalletService);
        userService = module.get<UserService>(UserService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Wallet" CASCADE');
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

    describe('createWallet', () => {
        it('should create a wallet', async () => {
            const walletAddress = faker.finance.ethereumAddress().toLowerCase();
            const result = await service.createWallet({ address: walletAddress });
            expect(result.id).toBeDefined();
            expect(result.address).toEqual(walletAddress.toLowerCase());
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
        let wallet: ethers.Wallet;
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
        let wallet: ethers.Wallet;
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
            address = wallet.address.toLowerCase();

            boundWallet = await service.createWallet({ address });
        });

        afterEach(async () => {
            await repository.query('TRUNCATE TABLE "Wallet" CASCADE');
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
            const data = { address, owner: { id: boundWallet.owner.id } };
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
});
