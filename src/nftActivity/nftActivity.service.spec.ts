// Import the required dependencies
import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Update } from './nftActivity.entity';
import { NftActivityService } from './nftActivity.service';
import { NftActivityModule } from './nftActivity.module';
import { faker } from '@faker-js/faker';
import { TypeOrmModule } from '@nestjs/typeorm';
import { postgresConfig } from '../lib/configs/db.config';
import { Collection } from '../collection/collection.entity';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { TierService } from '../tier/tier.service';
import { Coin } from '../sync-chain/coin/coin.entity';
import { CoinService } from '../sync-chain/coin/coin.service';

describe('NftActivityService', () => {
    let webHookService: NftActivityService;
    let repositoryCollection: Repository<Collection>;
    let organizationService: OrganizationService;
    let userService: UserService;
    let tierService: TierService;
    let coin: Coin;
    let coinService: CoinService;
    beforeEach(async () => {
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
                NftActivityModule,
            ],
        }).compile();
        repositoryCollection = module.get('CollectionRepository');
        webHookService = module.get<NftActivityService>(NftActivityService);
        userService = module.get<UserService>(UserService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        tierService = module.get<TierService>(TierService);
        coinService = module.get<CoinService>(CoinService);
    });
    afterAll(async () => {
        global.gc && global.gc();
    });


    describe('createEventFromAlcheny', () => {
        it('should create event from alchemy', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
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
                owner: owner,
            });
            const address = faker.finance.ethereumAddress();
            const collection = await repositoryCollection.save({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: address,
                artists: [],
                tags: [],
                organization: organization,
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
            const tiers = await tierService.createTier({
                name: faker.company.name(),
                totalMints: 100,
                collection: { id: collection.id },
                paymentTokenAddress: coin.address,
                tierId: 0,
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
            });
            const updateData = {
                event: {
                    activity: [
                        {
                            fromAddress: `arb:${address}`,
                            erc1155Metadata: [
                                { tokenId: 24 }
                            ]
                        }

                    ]
                },
                createdAt: faker.date.recent().getTime(),
            };
            const update = await webHookService.createActivity(updateData);
            expect(update.id).toBeDefined();
            expect(update.addressCollection).toBeDefined();
            expect(update.timeStamp).toBeDefined();
        });
    });
});