import { faker } from '@faker-js/faker';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from '../wallet/wallet.service';
import { Repository } from 'typeorm';
import { postgresConfig } from '../lib/configs/db.config';
import { Relationship } from './relationship.entity';
import { RelationshipModule } from './relationship.module';
import { RelationshipService } from './relationship.service';
import { WalletModule } from "../wallet/wallet.module";

describe('RelationshipService', () => {
    let repository: Repository<Relationship>;
    let service: RelationshipService;
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
                RelationshipModule,
                WalletModule,
            ]
        }).compile();

        service = module.get<RelationshipService>(RelationshipService);
        walletService = module.get<WalletService>(WalletService);
        repository = module.get('RelationshipRepository');
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    describe('getFollowers', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await repository.insert({ follower: { id: wallet2.id }, following: { id: wallet1.id } });
            await repository.insert({ follower: { id: wallet3.id }, following: { id: wallet1.id } });

            const followers = await service.getFollowers(wallet1.id);
            expect(followers.length).toEqual(2);
            expect(followers[0].following.address).toEqual(wallet1.address);
            expect(followers[0].follower.address).toEqual(wallet2.address);
            expect(followers[1].following.address).toEqual(wallet1.address);
            expect(followers[1].follower.address).toEqual(wallet3.address);
        });
    });

    describe('getFollowersByAddress', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await repository.insert({ follower: { id: wallet2.id }, following: { id: wallet1.id } });
            await repository.insert({ follower: { id: wallet3.id }, following: { id: wallet1.id } });

            const followers = await service.getFollowersByAddress(wallet1.address);
            expect(followers.length).toEqual(2);
            expect(followers[0].following.address).toEqual(wallet1.address);
            expect(followers[0].follower.address).toEqual(wallet2.address);
            expect(followers[1].following.address).toEqual(wallet1.address);
            expect(followers[1].follower.address).toEqual(wallet3.address);
        });
    });

    describe('countFollowers', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await repository.insert({ follower: { id: wallet2.id }, following: { id: wallet1.id } });
            await repository.insert({ follower: { id: wallet3.id }, following: { id: wallet1.id } });

            const followersTotal = await service.countFollowers(wallet1.id);
            expect(followersTotal).toEqual(2);
        });
    });

    describe('countFollowersByAddress', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await repository.insert({ follower: { id: wallet2.id }, following: { id: wallet1.id } });
            await repository.insert({ follower: { id: wallet3.id }, following: { id: wallet1.id } });

            const followersTotal = await service.countFollowersByAddress(wallet1.address);
            expect(followersTotal).toEqual(2);
        });
    });

    describe('getFollowersByAddress', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await repository.insert({ follower: { id: wallet2.id }, following: { id: wallet1.id } });
            await repository.insert({ follower: { id: wallet3.id }, following: { id: wallet1.id } });

            const followers = await service.getFollowersByAddress(wallet1.address);
            expect(followers.length).toEqual(2);
            expect(followers[0].following.address).toEqual(wallet1.address);
            expect(followers[0].follower.address).toEqual(wallet2.address);
            expect(followers[1].following.address).toEqual(wallet1.address);
            expect(followers[1].follower.address).toEqual(wallet3.address);
        });
    });

    describe('getFollowings', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await repository.insert({ follower: { id: wallet2.id }, following: { id: wallet1.id } });
            await repository.insert({ follower: { id: wallet3.id }, following: { id: wallet1.id } });

            const followers = await service.getFollowings(wallet2.id);
            expect(followers.length).toEqual(1);
            expect(followers[0].following.address).toEqual(wallet1.address);
            expect(followers[0].follower.address).toEqual(wallet2.address);
        });
    });

    describe('getFollowersByAddress', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await repository.insert({ follower: { id: wallet2.id }, following: { id: wallet1.id } });
            await repository.insert({ follower: { id: wallet3.id }, following: { id: wallet1.id } });

            const followers = await service.getFollowingsByAddress(wallet2.address);
            expect(followers.length).toEqual(1);
            expect(followers[0].following.address).toEqual(wallet1.address);
            expect(followers[0].follower.address).toEqual(wallet2.address);
        });
    });

    describe('countFollowings', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await repository.insert({ follower: { id: wallet2.id }, following: { id: wallet1.id } });
            await repository.insert({ follower: { id: wallet3.id }, following: { id: wallet1.id } });

            const followingsTotal = await service.countFollowings(wallet2.id);
            expect(followingsTotal).toEqual(1);
        });
    });

    describe('countFollowingsByAddress', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await repository.insert({ follower: { id: wallet2.id }, following: { id: wallet1.id } });
            await repository.insert({ follower: { id: wallet3.id }, following: { id: wallet1.id } });

            const followingsTotal = await service.countFollowingsByAddress(wallet2.address);
            expect(followingsTotal).toEqual(1);
        });
    });

    describe('createRelationshipByAddress', () => {
        it('should work', async () => {
            const wallet1 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet2 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });
            const wallet3 = await walletService.createWallet({ address: faker.finance.ethereumAddress() });

            await service.createRelationshipByAddress({ followingAddress: wallet1.address, followerAddress: wallet2.address });
            await service.createRelationshipByAddress({ followingAddress: wallet1.address, followerAddress: wallet3.address });

            const relationships = await repository.find({
                where: { following: { id: wallet1.id } },
                relations: ['following', 'follower']
            })
            expect(relationships.length).toEqual(2)
        })
    })
});