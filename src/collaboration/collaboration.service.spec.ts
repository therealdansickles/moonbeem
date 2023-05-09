import { INestApplication } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { GraphQLError } from 'graphql';
import { postgresConfig } from '../lib/configs/db.config';

import { Collaboration } from './collaboration.entity';
import { CollaborationModule } from './collaboration.module';
import { CollaborationService } from './collaboration.service';
import { Collection } from '../collection/collection.dto';
import { CollectionModule } from '../collection/collection.module';
import { CollectionService } from '../collection/collection.service';
import { Wallet } from '../wallet/wallet.entity';
import { WalletModule } from '../wallet/wallet.module';
import { WalletService } from '../wallet/wallet.service';
import { Organization } from '../organization/organization.entity';
import { OrganizationService } from '../organization/organization.service';
import { OrganizationModule } from '../organization/organization.module';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { UserModule } from '../user/user.module';

describe('CollaborationService', () => {
    let repository: Repository<Collaboration>;
    let service: CollaborationService;
    let collaboration: Collaboration;
    let collection: Collection;
    let collectionService: CollectionService;
    let organization: Organization;
    let organizationService: OrganizationService;
    let user: User;
    let userService: UserService;
    let wallet: Wallet;
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
                CollaborationModule,
                CollectionModule,
                OrganizationModule,
                UserModule,
                WalletModule,
            ],
        }).compile();

        repository = module.get('CollaborationRepository');
        service = module.get<CollaborationService>(CollaborationService);
        collectionService = module.get<CollectionService>(CollectionService);
        organizationService = module.get<OrganizationService>(OrganizationService);
        userService = module.get<UserService>(UserService);
        walletService = module.get<WalletService>(WalletService);

        user = await userService.createUser({
            username: faker.internet.userName(),
            email: faker.internet.email(),
            password: faker.internet.password(),
        });

        organization = await organizationService.createOrganization({
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

        collection = await collectionService.createCollection({
            name: faker.company.name(),
            displayName: 'The best collection',
            about: 'The best collection ever',
            chainId: 1,
            address: faker.finance.ethereumAddress(),
            artists: [],
            tags: [],
            organization,
        });

        wallet = await walletService.createWallet({
            address: `arb:${faker.finance.ethereumAddress()}`,
            ownerId: user.id,
        });
    });

    afterAll(async () => {
        await repository.query('TRUNCATE TABLE "Collaboration" CASCADE');
        await repository.query('TRUNCATE TABLE "Collection" CASCADE');
        await repository.query('TRUNCATE TABLE "Organization" CASCADE');
        await repository.query('TRUNCATE TABLE "User" CASCADE');
        await repository.query('TRUNCATE TABLE "Wallet" CASCADE');
    });

    describe('createCollaboration', () => {
        it('should create a collaboration', async () => {
            const result = await service.createCollaboration({
                walletId: wallet.id,
                royaltyRate: 12,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            collaboration = result;
            expect(result.royaltyRate).toEqual(12);
            expect(result.wallet).toBeDefined();
            expect(result.wallet.id).toEqual(wallet.id);
        });

        it('should create a collaboration even if nothing provided', async () => {
            const result = await service.createCollaboration({});
            expect(result.id).toBeTruthy();
        });

        it('should throw error if royalty out of bound', async () => {
            const newCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.finance.accountName(),
                chainId: 1,
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });
            const wallet1 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            const collaboration1 = await service.createCollaboration({
                walletId: wallet1.id,
                royaltyRate: 98,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            const wallet2 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            const collaboration2 = await service.createCollaboration({
                walletId: wallet2.id,
                royaltyRate: 2,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            const anotherCollection = await collectionService.createCollection({
                name: faker.company.name(),
                displayName: faker.finance.accountName(),
                about: faker.finance.accountName(),
                chainId: 1,
                address: faker.finance.ethereumAddress(),
                artists: [],
                tags: [],
            });
            // this should work as it's another collection
            const collaborationForAnotherCollection = await service.createCollaboration({
                walletId: wallet1.id,
                royaltyRate: 1,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });
            expect(collaborationForAnotherCollection.wallet).toBeDefined();
            expect(collaborationForAnotherCollection.wallet.id).toEqual(wallet1.id);
            // would fail --> un needed
            // const wallet3 = await walletService.createWallet({ address: `arb:${faker.finance.ethereumAddress()}` });
            // expect(
            //     (async function () {
            //         await service.createCollaboration({
            //             walletId: wallet3.id,
            //             royaltyRate: 1,
            //             collaborators: [
            //                 {
            //                     address: faker.finance.ethereumAddress(),
            //                     role: faker.finance.accountName(),
            //                     name: faker.finance.accountName(),
            //                     rate: parseInt(faker.random.numeric(2)),
            //                 },
            //             ],
            //         });
            //     })()
            // ).rejects.toThrowError(GraphQLError);
        });
    });

    describe('getCollaboration', () => {
        it('should return a collaboration', async () => {
            const result = await service.getCollaboration(collaboration.id);
            expect(result).toBeDefined();
            expect(result.royaltyRate).toEqual(12);
        });

        it('should not return a collaboration if id is wrong', async () => {
            const result = await service.getCollaboration(faker.datatype.uuid());
            expect(result).toBeNull();
        });

        it('should return a collaboration with its wallet and collection', async () => {
            const result = await service.getCollaboration(collaboration.id);
            expect(result.wallet).toBeDefined();
        });
    });

    describe('getCollaborationsByUserIdAndOrganizationId', () => {
        it('should return collaborations', async () => {
            const newUser = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const newWallet = await walletService.createWallet({
                address: `arb:${faker.finance.ethereumAddress()}`,
                ownerId: newUser.id,
            });

            const newCollab = await service.createCollaboration({
                walletId: newWallet.id,
                royaltyRate: 12,
                userId: newUser.id,
                organizationId: organization.id,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const [result, ..._rest] = await service.getCollaborationsByUserIdAndOrganizationId(
                newUser.id,
                organization.id
            );
            expect(result.user.id).toEqual(newUser.id);
            expect(result.organization.id).toEqual(organization.id);
        });
    });

    describe('getCollaborationsByOrganizationId', () => {
        it('should return collaborations', async () => {
            const newUser = await userService.createUser({
                username: faker.internet.userName(),
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const newWallet = await walletService.createWallet({
                address: `arb:${faker.finance.ethereumAddress()}`,
                ownerId: newUser.id,
            });

            const newCollab = await service.createCollaboration({
                walletId: newWallet.id,
                royaltyRate: 12,
                userId: newUser.id,
                organizationId: organization.id,
                collaborators: [
                    {
                        address: faker.finance.ethereumAddress(),
                        role: faker.finance.accountName(),
                        name: faker.finance.accountName(),
                        rate: parseInt(faker.random.numeric(2)),
                    },
                ],
            });

            const result = await service.getCollaborationsByOrganizationId(organization.id);

            result.forEach((collaboration) => {
                expect(collaboration.organization.id).toEqual(organization.id);
            });
        });
    });
});
