import { Repository } from 'typeorm';
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
                    host: postgresConfig.syncChain.host,
                    port: postgresConfig.syncChain.port,
                    username: postgresConfig.syncChain.username,
                    password: postgresConfig.syncChain.password,
                    database: postgresConfig.syncChain.database,
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

    describe('executeGlobalSearchV1', () => {
        it('should perform search for collection', async () => {
            const name = faker.company.name();
            await collectionService.createCollection({
                name,
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });

            const result = await service.executeGlobalSearchV1({ searchTerm: name });

            expect(result.collections.data).toBeDefined();
            expect(result.users.data).toBeDefined();
            expect(result.collections.total).toEqual(1);
            expect(result.collections.isLastPage).toBeTruthy();
            expect(result.collections.data[0].name).toEqual(name);
        });

        it('should perform search for user', async () => {
            const name = faker.name.fullName();
            const user = await userService.createUser({
                name,
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: user.id,
            });

            const result = await service.executeGlobalSearchV1({ searchTerm: wallet.address });

            expect(result.collections.data).toBeDefined();
            expect(result.users.data).toBeDefined();
            expect(result.users.total).toEqual(1);
            expect(result.users.isLastPage).toBeTruthy();
            expect(result.users.data[0].address).toEqual(wallet.address);
            expect(result.users.data[0].name).toEqual(name);
        });
    });
});
