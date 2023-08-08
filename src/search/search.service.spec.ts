import { faker } from '@faker-js/faker';

import { CollectionService } from '../collection/collection.service';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { WalletService } from '../wallet/wallet.service';
import { SearchService } from './search.service';

describe('SearchService', () => {
    let service: SearchService;
    let collectionService: CollectionService;
    let walletService: WalletService;
    let userService: UserService;
    let organizationService: OrganizationService;

    beforeAll(async () => {
        service = global.searchService;
        collectionService = global.collectionService;
        walletService = global.walletService;
        userService = global.userService;
        organizationService = global.organizationService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('search bar', () => {
        it('should perform search for all', async () => {
            const name = faker.person.fullName();
            const user = await userService.createUser({
                name,
                email: faker.internet.email(),
                password: 'password',
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
                avatarUrl: faker.image.url(),
                backgroundUrl: faker.image.url(),
                websiteUrl: faker.internet.url(),
                twitter: faker.internet.userName(),
                instagram: faker.internet.userName(),
                discord: faker.internet.userName(),
                owner: user,
            });

            const collectionAddress = faker.finance.ethereumAddress();
            const collection = await collectionService.createCollectionWithTiers({
                name: `${name}'s collection`,
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: collectionAddress,
                tags: [],
                tiers: [
                    {
                        name: faker.company.name(),
                        totalMints: 200,
                        paymentTokenAddress: faker.finance.ethereumAddress(),
                        tierId: 0,
                        price: '200',
                        metadata: {
                            uses: [],
                            properties: {
                                level: {
                                    name: 'level',
                                    type: 'string',
                                    value: 'basic',
                                    display_value: 'Basic',
                                },
                                holding_days: {
                                    name: 'holding_days',
                                    type: 'integer',
                                    value: 125,
                                    display_value: 'Days of holding',
                                },
                            },
                        },
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

            const searchCollectionByAddress = await service.searchFromCollection({ keyword: collectionAddress });
            expect(searchCollectionByAddress.collections).toBeDefined();
            expect(searchCollectionByAddress.total).toEqual(1);
            expect(searchCollectionByAddress.collections[0].address).toEqual(collectionAddress.toLowerCase());
            expect(searchCollectionByAddress.collections[0].totalSupply).toEqual(200);
        });
    });
});
