import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../lib/configs/db.config';
import { Redeem } from './redeem.entity';
import { RedeemModule } from './redeem.module';
import { RedeemService } from './redeem.service';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { OrganizationModule } from '../organization/organization.module';
import { OrganizationService } from '../organization/organization.service';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';

describe('RedeemService', () => {
    let repository: Repository<Redeem>;
    let service: RedeemService;
    let userService: UserService;
    let organizationService: OrganizationService;
    let collectionService: CollectionService;

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
                RedeemModule,
                UserModule,
                OrganizationModule,
                CollectionModule,
            ],
        }).compile();

        repository = module.get('RedeemRepository');
        service = module.get<RedeemService>(RedeemService);
        userService = module.get<UserService>(UserService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        collectionService = module.get<CollectionService>(CollectionService);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('createRedeem', () => {
        it('should create redeem', async () => {
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

            const collection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: 'The best collection',
                about: 'The best collection ever',
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
                organization: organization,
            });

            const result = await service.createRedeem({
                collection: { id: collection.id },
                tokenId: parseInt(faker.random.numeric(1)),
                deliveryAddress: faker.address.streetAddress(),
                email: faker.internet.email()
            });
            expect(result.collection).toEqual(collection.id);
        });
    });

});
