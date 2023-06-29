import { Test, TestingModule } from '@nestjs/testing';

import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { Nft } from './nft.entity';
import { NftModule } from './nft.module';
import { NftService } from './nft.service';
import { Repository } from 'typeorm';
import { TierModule } from '../tier/tier.module';
import { TierService } from '../tier/tier.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { WalletModule } from '../wallet/wallet.module';
import { WalletService } from '../wallet/wallet.service';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';

describe('NftService', () => {
    let repository: Repository<Nft>;
    let service: NftService;
    let tierService: TierService;
    let collectionService: CollectionService;
    let userService: UserService;
    let walletService: WalletService;

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
                UserModule,
                WalletModule,
                CollectionModule,
                TierModule,
                NftModule,
            ],
        }).compile();

        repository = module.get('CollectionRepository');
        service = module.get<NftService>(NftService);
        userService = module.get<UserService>(UserService);
        walletService = module.get<WalletService>(WalletService);
        collectionService = module.get<CollectionService>(CollectionService);
        tierService = module.get<TierService>(TierService);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('createOrUpdateNftByTokenId', () => {
        it('should create a nft record if didn\'t exist', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                // paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const result = await service.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId: faker.random.numeric(1),
                properties: {
                    'foo': 'bar'
                }
            });
            expect(result.id).toBeTruthy();
            expect(result.properties.foo).toEqual('bar');
        });

        it('should update a nft record if already exist', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                // paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const tokenId = +faker.random.numeric(1);

            await service.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    'foo': 'bar'
                }
            });

            const result = await service.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    'foo': 'barrrrr'
                }
            });
            expect(result.id).toBeTruthy();
            expect(result.properties.foo).toEqual('barrrrr');
        });
    });

    describe('getNftByQuery', () => {
        it('should work', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
            });

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                creator: { id: wallet.id },
            });

            const tier = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                price: '100',
                // paymentTokenAddress: coin.address,
                tierId: 0,
            });

            const tokenId = +faker.random.numeric(1);

            const nft = await service.createOrUpdateNftByTokenId({
                collectionId: collection.id,
                tierId: tier.id,
                tokenId,
                properties: {
                    'foo': 'bar'
                }
            });

            const result = await service.getNftByQuery({
                collection: { id: collection.id },
                tokenId
            });
            expect(result.id).toEqual(nft.id);
        });
    });

});
