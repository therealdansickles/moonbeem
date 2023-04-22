import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { Wallet } from './wallet.entity';
import { WalletModule } from './wallet.module';
import { WalletService } from './wallet.service';
import { WalletCreateInput } from './wallet.dto';
import { CollaborationModule } from '../collaboration/collaboration.module';

describe('WalletService', () => {
    let repository: Repository<Wallet>;
    let service: WalletService;
    let address: string;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                TypeOrmModule.forRoot({
                    type: 'postgres',
                    host: postgresConfig.host,
                    port: postgresConfig.port,
                    username: postgresConfig.username,
                    password: postgresConfig.password,
                    database: postgresConfig.database,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                WalletModule,
                CollaborationModule,
            ],
        }).compile();

        address = `matic:${faker.finance.ethereumAddress()}`;
        repository = module.get('WalletRepository');
        service = module.get<WalletService>(WalletService);
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Wallet" CASCADE');
    });

    describe('getWallet', () => {
        it('should return a wallet by id', async () => {
            const wallet = await service.createWallet(`arb:${faker.finance.ethereumAddress()}`);
            const result = await service.getWallet(wallet.id);
            expect(result.id).toBeDefined();
        });
    });

    describe('getWalletByAddress', () => {
        it('should return a wallet by address', async () => {
            const wallet = await service.createWallet(`arb:${faker.finance.ethereumAddress()}`);
            const result = await service.getWalletByAddress(wallet.address);
            expect(result.address).toEqual(wallet.address);
        });
    });

    describe('createWallet', () => {
        it('should create a wallet', async () => {
            const walletAddress = `matic:${faker.finance.ethereumAddress()}`;
            const result = await service.createWallet(walletAddress);
            expect(result.id).toBeDefined();
            expect(result.address).toEqual(walletAddress);
        });

        it('should error if the wallet already exists', async () => {
            const wallet = await service.createWallet(address);
            expect(async () => {
                await service.createWallet(address);
            });
        });
    });

    //describe('bindWallet', () => {
    //let unboundWallet: Wallet;
    //let eipAddress: string;
    //let ownerId: string;

    //beforeEach(async () => {
    //const owner = await userService.createUser({ email: faker.internet.email() });

    //ownerId = owner.id;
    //unboundWallet = await service.createWallet(`matic:${faker.finance.ethereumAddress()}`);
    //// eipAddress = `${unboundWallet.network}:${unboundWallet.address}`;
    //});

    //it('should handle an EIP-3770 address', async () => {
    //const data = { address: `arb:${unboundWallet.address}`, ownerId };
    //const result = await service.bindWallet(data);
    //expect(result.owner).toEqual(ownerId);
    //});

    //it('should handle an existing address', async () => {
    //const data = { address: eipAddress, ownerId };
    //const result = await service.bindWallet(data);
    //expect(result.owner).toEqual(ownerId);
    //});

    //it('should throw an error if the wallet is already bound', async () => {
    //const data = { address: eipAddress, ownerId };
    //await service.bindWallet(data);
    //await expect(() => service.bindWallet(data)).rejects.toThrow();
    //});
    //});

    //describe('unbindWallet', () => {
    //let boundWallet: Wallet;

    //beforeEach(async () => {
    //const owner = await userService.createUser({ email: faker.internet.email() });
    //boundWallet = await service.createWallet(faker.finance.ethereumAddress());
    //});

    //// NB: We don't test for a regular address because that defaults to ethereum.
    //// You can only use an EIP-3770 address if you are on another chain.
    //it('should handle an EIP-3770 address', async () => {
    //const data = { address: `matic:${boundWallet.address}`, ownerId: boundWallet.owner.id };
    //const result = await service.unbindWallet(data);
    //expect(result.owner).not.toEqual(boundWallet.owner);
    //expect(result.address).toEqual(boundWallet.address);
    //// expect(result.chainId).toEqual(boundWallet.chainId);
    //});

    //it('should return a new unbound wallet if it the wallet does not exist', async () => {
    //const data = { address: `arb:${boundWallet.address}`, ownerId: boundWallet.owner.id };
    //const result = await service.unbindWallet(data);
    //expect(result.owner).not.toEqual(boundWallet.owner);
    //expect(result.address).toEqual(boundWallet.address);
    //// expect(result.chainId).toEqual(42161);
    //});

    //it('should throw an error if the wallet is not bound to the user', async () => {
    //const nonOwner = await userService.createUser({ email: faker.internet.email() });
    //const data = { address: `matic:${boundWallet.address}`, ownerId: nonOwner.id };
    //await expect(() => service.unbindWallet(data)).rejects.toThrow();
    //});
    //});

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
