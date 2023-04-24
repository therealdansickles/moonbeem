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
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';

describe('SearchService', () => {
    let service: SearchService;
    let collectionService: CollectionService;
    let walletService: WalletService;
    let authService: AuthService;

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
                SearchModule,
                CollectionModule,
                WalletModule,
                AuthModule,
            ],
        }).compile();

        service = module.get<SearchService>(SearchService);
        collectionService = module.get<CollectionService>(CollectionService);
        walletService = module.get<WalletService>(WalletService);
        authService = module.get<AuthService>(AuthService);
    });

    afterAll(async () => {});

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
            const user = await authService.createUserWithEmail({
                name,
                email: faker.internet.email(),
                password: faker.internet.password(),
            });
            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                ownerId: user.user.id,
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
