import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from '../lib/configs/db.config';
import { faker } from '@faker-js/faker';
import { SearchService } from './search.service';
import { SearchModule } from './search.module';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { WalletService } from '../wallet/wallet.service';
import { WalletModule } from '../wallet/wallet.module';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';

describe('SearchService', () => {
    let service: SearchService;
    let collectionService: CollectionService;
    let walletService: WalletService;
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
                }),
                TypeOrmModule.forRoot({
                    name: 'sync_chain',
                    type: 'postgres',
                    url: postgresConfig.syncChain.url,
                    autoLoadEntities: true,
                    synchronize: true,
                    logging: false,
                }),
                SearchModule,
                CollectionModule,
                WalletModule,
                UserModule,
            ],
        }).compile();

        service = module.get<SearchService>(SearchService);
        collectionService = module.get<CollectionService>(CollectionService);
        walletService = module.get<WalletService>(WalletService);
        userService = module.get<UserService>(UserService);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('search bar', () => {
        it('should perform search for collection', async () => {
            const name = faker.company.name();
            const collection = await collectionService.createCollection({
                name,
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });

            const result = await service.searchFromCollection({ keyword: collection.name });
            expect(result.collections).toBeDefined();
            expect(result.total).toEqual(1);
            expect(result.collections[0].name).toEqual(name);
        });

        it('should perform search for user', async () => {
            const name = faker.name.fullName();
            const user = await userService.createUser({
                name,
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const result = await service.searchFromUser({ keyword: user.name });

            expect(result.users).toBeDefined();
            expect(result.total).toEqual(1);
            expect(result.users[0].name).toEqual(name);
        });

        it('should perform search for wallet', async () => {
            const name = faker.name.fullName();
            const user = await userService.createUser({
                name: faker.name.fullName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                name: name,
                ownerId: user.id,
            });
            const result = await service.searchFromWallet({ keyword: wallet.name });

            expect(result.wallets).toBeDefined();
            expect(result.total).toEqual(1);
            expect(result.wallets[0].name).toEqual(name);
        });
    });
});
