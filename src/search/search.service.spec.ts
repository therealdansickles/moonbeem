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
import { OrganizationService } from '../organization/organization.service';

describe('SearchService', () => {
    let service: SearchService;
    let collectionService: CollectionService;
    let walletService: WalletService;
    let userService: UserService;
    let organizationService: OrganizationService;

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
        organizationService = module.get<OrganizationService>(OrganizationService);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('search bar', () => {
        it('should perform search for all', async () => {
            const name = faker.name.fullName();
            const user = await userService.createUser({
                name,
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const wallet = await walletService.createWallet({
                address: faker.finance.ethereumAddress(),
                name: name,
                ownerId: user.id,
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

            const collection = await collectionService.createCollectionWithTiers({
                name: `${name}'s collection`,
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                tags: [],
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: faker.finance.ethereumAddress(),
                        tierId: 0,
                        price: '200',
                    },
                ],
                organization: organization,
            });

            const userResult = await service.searchFromUser({ keyword: user.name });

            expect(userResult.users).toBeDefined();
            expect(userResult.total).toEqual(1);
            expect(userResult.users[0].name).toEqual(name);

            const walletResult = await service.searchFromWallet({ keyword: wallet.name });
            expect(walletResult.wallets).toBeDefined();
            expect(walletResult.total).toEqual(1);
            expect(walletResult.wallets[0].name).toEqual(name);

            const collectionResult = await service.searchFromCollection({ keyword: collection.name });
            expect(collectionResult.collections).toBeDefined();
            expect(collectionResult.total).toEqual(1);
            expect(collectionResult.collections[0].name).toEqual(`${name}'s collection`);
            expect(collectionResult.collections[0].totalSupply).toEqual(200);
        });
    });
});
