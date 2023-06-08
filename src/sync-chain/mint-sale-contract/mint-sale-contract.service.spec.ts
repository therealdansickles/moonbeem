import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { faker } from '@faker-js/faker';
import { postgresConfig } from '../../lib/configs/db.config';
import { MintSaleContractModule } from './mint-sale-contract.module';
import { MintSaleContractService } from './mint-sale-contract.service';
import { CollectionService } from '../../collection/collection.service';
import { CollectionModule } from '../../collection/collection.module';
import { UserService } from '../../user/user.service';
import { OrganizationService } from '../../organization/organization.service';
import { UserModule } from '../../user/user.module';
import { OrganizationModule } from '../../organization/organization.module';

describe('MintSaleContractService', () => {
    let service: MintSaleContractService;
    let collectionService: CollectionService;
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
                MintSaleContractModule,
                CollectionModule,
                UserModule,
                OrganizationModule,
            ],
        }).compile();

        service = module.get<MintSaleContractService>(MintSaleContractService);
        collectionService = module.get<CollectionService>(CollectionService);
        userService = module.get<UserService>(UserService);
        organizationService = module.get<OrganizationService>(OrganizationService);
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('MintSaleContract', () => {
        it('should get an contract', async () => {
            const contract = await service.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
            });

            const result = await service.getMintSaleContract(contract.id);
            expect(result.id).toEqual(contract.id);
        });
    });
    describe('MerkleTree', () => {
        const amount = faker.random.numeric(3);
        const address = faker.finance.ethereumAddress();
        let merkleRoot = '';
        it('should create merkle tree', async () => {
            const result = await service.createMerkleRoot({
                data: [{ address: address, amount: amount }],
            });
            merkleRoot = result.merkleRoot;
            expect(result.merkleRoot).toBeDefined();
        });
        it('should get merkle proof', async () => {
            const result = await service.getMerkleProof(address, merkleRoot);

            expect(result).toBeDefined();
            expect(result.address.toLowerCase()).toBe(address.toLowerCase());
            expect(result.amount).toBe(amount);
            expect(result.proof).toBeDefined();
        });
    });
    describe('getMintSaleContractByCollection', () => {
        it('should return a contract, if one exists', async () => {
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

            const contract = await service.createMintSaleContract({
                height: parseInt(faker.random.numeric(5)),
                txHash: faker.datatype.hexadecimal({ length: 66, case: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                sender: faker.finance.ethereumAddress(),
                address: faker.finance.ethereumAddress(),
                royaltyReceiver: faker.finance.ethereumAddress(),
                royaltyRate: 10000,
                derivativeRoyaltyRate: 1000,
                isDerivativeAllowed: true,
                beginTime: Math.floor(faker.date.recent().getTime() / 1000),
                endTime: Math.floor(faker.date.recent().getTime() / 1000),
                tierId: 0,
                price: faker.random.numeric(19),
                paymentToken: faker.finance.ethereumAddress(),
                startId: 1,
                endId: 100,
                currentId: 1,
                tokenAddress: faker.finance.ethereumAddress(),
                collectionId: collection.id,
            });

            const result = await service.getMintSaleContractByCollection(collection.id);
            expect(result).toBeDefined();
            expect(result.id).toEqual(contract.id);
        });

        it('should return null for contract, if no contract exists', async () => {
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

            const result = await service.getMintSaleContractByCollection(collection.id);
            expect(result).toBe(null);
        });
    });
});
