import { addSeconds, subSeconds } from 'date-fns';
import { Repository } from 'typeorm';

import { faker } from '@faker-js/faker';

import { CollectionService } from '../collection/collection.service';
import { Membership } from '../membership/membership.entity';
import { CoinQuotes } from '../sync-chain/coin/coin.dto';
import { CoinService } from '../sync-chain/coin/coin.service';
import {
    MintSaleTransactionService
} from '../sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import {
    createCoin, createCollection, createMintSaleTransaction, createOrganization
} from '../test-utils';
import { UserService } from '../user/user.service';
import { OrganizationService } from './organization.service';

describe('OrganizationService', () => {
    let service: OrganizationService;
    let userService: UserService;
    let transactionService: MintSaleTransactionService;
    let coinService: CoinService;
    let membershipRepository: Repository<Membership>;
    let collectionService: CollectionService;

    beforeAll(async () => {
        service = global.organizationService;
        userService = global.userService;
        coinService = global.coinService;
        transactionService = global.mintSaleTransactionService;
        membershipRepository = global.membershipRepository;
        collectionService = global.collectionService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('getOrganization', () => {
        it('should get an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });

            const result = await service.getOrganization(organization.id);
            expect(result.id).toEqual(organization.id);
        });
    });

    describe('createOrganization', () => {
        it('should create an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const organization = await createOrganization(service, { owner });

            expect(organization.id).toBeDefined();
            expect(organization.owner.id).toEqual(owner.id);
            expect(organization.owner.email).toEqual(owner.email);

            const memberships = await membershipRepository.findBy({
                organization: { id: organization.id },
                user: { id: owner.id },
            });

            expect(memberships.length).toEqual(1);
            expect(memberships[0].canDeploy).toEqual(true);
            expect(memberships[0].canEdit).toEqual(true);
            expect(memberships[0].canManage).toEqual(true);
        });

        it.skip('should create an organization and invite users', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });

            expect(organization.id).toBeDefined();
            expect(organization.owner.id).toEqual(owner.id);
            expect(organization.owner.email).toEqual(owner.email);
        });

        it('should throw an error when create a organization with an existed name', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const name = faker.company.name();

            await createOrganization(service, { name, owner });

            try {
                await createOrganization(service, { name, owner });
            } catch (error) {
                expect((error as Error).message).toBe(`Organization with name ${name} already existed.`);
            }
        });
    });

    describe('createPersonalOrganization', () => {
        it('should create a personal organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await service.createPersonalOrganization(owner);

            expect(organization.id).toBeDefined();
            expect(organization.name).toBeDefined();
            expect(organization.owner.id).toEqual(owner.id);
            expect(organization.kind).toEqual('personal');
            expect(organization.owner.email).toEqual(owner.email);
        });
    });

    describe('updateOrganization', () => {
        it('should update an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });

            const result = await service.updateOrganization(organization.id, {
                displayName: 'The best organization',
            });

            expect(result.displayName).toEqual('The best organization');
            expect(result.owner.id).toEqual(owner.id);
            expect(result.owner.email).toEqual(owner.email);
        });

        it('should throw an error when update an organization with an existed name', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const anotherOrganization = await service.createPersonalOrganization(owner);

            try {
                await service.updateOrganization(anotherOrganization.id, {
                    name: organization.name,
                });
            } catch (error) {
                expect((error as Error).message).toBe(`Organization with name ${organization.name} already existed.`);
            }
        });
    });

    describe('deleteOrganization', () => {
        it('should delete an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });

            const result = await service.deleteOrganization(organization.id);
            expect(result).toBeTruthy();
        });
        it('shoule delete organization and membership, if only one member', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await createOrganization(service, { owner });

            const result = await service.deleteOrganization(organization.id);
            expect(result).toBeTruthy();

            const memberships = await membershipRepository.findBy({
                organization: { id: organization.id },
                user: { id: owner.id },
            });

            expect(memberships.length).toEqual(0);
        });

        it('should throw an error, if org contains more than two memberships', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const owner2 = await userService.createUser({
                email: faker.internet.email(),
                password: faker.internet.password(),
            });

            const organization = await createOrganization(service, { owner });
            await membershipRepository.create({
                canEdit: true,
                canDeploy: true,
                canManage: true,
                user: { id: owner2.id },
                organization: { id: organization.id },
            });
            try {
                await service.deleteOrganization(organization.id);
            } catch (error) {
                expect((error as Error).message).toBe(/Organization contains more than two memberships./);
            }
        });
    });

    describe('transferOrganization', () => {
        it('should transfer an organization', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const user = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });

            const result = await service.transferOrganization(organization.id, user.id);
            expect(result.owner.id).toEqual(user.id);
        });

        it('should throw an error if the user does not exist', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });

            const randomUUID = faker.string.uuid();

            try {
                await service.transferOrganization(organization.id, randomUUID);
            } catch (error) {
                expect((error as Error).message).toBe(`User with id ${randomUUID} doesn't exist.`);
            }
        });
    });

    describe('getOrganizationsByOwnerId', () => {
        it('should return all the organizations a user is owner on', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const differentOwner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            await createOrganization(service, { owner });
            await createOrganization(service, { owner });
            await createOrganization(service, { owner: differentOwner });

            const result = await service.getOrganizationsByOwnerId(owner.id);
            expect(result.length).toEqual(2);
        });
    });

    describe('getAggregatedBuyers', () => {
        it('should be return the number of aggregated buyers', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const collection = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection.address,
                txTime: Math.floor(new Date().getTime() / 1000),
            });

            const result = await service.getAggregatedBuyers(organization.id);
            expect(result.daily).toBe(1);
            expect(result.weekly).toBe(1);
            expect(result.monthly).toBe(1);
        });

        it('should be return the number of aggregated buyers, multiple collections', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const collection = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection.address,
                txTime: Math.floor(new Date().getTime() / 1000),
            });

            const collection1 = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection1.address,
                txTime: Math.floor(new Date().getTime() / 1000),
            });

            const result = await service.getAggregatedBuyers(organization.id);
            expect(result.monthly).toBe(2);
            expect(result.weekly).toBe(2);
            expect(result.daily).toBe(2);
        });

        it('should be return 0, if no collection be created', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });

            const result = await service.getAggregatedBuyers(organization.id);
            expect(result.monthly).toBe(0);
            expect(result.weekly).toBe(0);
            expect(result.daily).toBe(0);
        });
    });

    describe('getAggregatedEarnings', () => {
        it('should return the number of aggregated earning', async () => {
            const coin = await createCoin(coinService);

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const collection = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection.address,
                paymentToken: coin.address,
                txTime: Math.floor(new Date().getTime() / 1000),
                price: '1000000000000000000',
            });
            await createMintSaleTransaction(transactionService, {
                address: collection.address,
                paymentToken: coin.address,
                txTime: Math.floor(new Date().getTime() / 1000),
                price: '1000000000000000000',
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getAggregatedEarnings(organization.id);
            expect(result.monthly).toBe(tokenPriceUSD * 2);
            expect(result.weekly).toBe(tokenPriceUSD * 2);
            expect(result.daily).toBe(tokenPriceUSD * 2);
        });

        it('should return the number of aggregated data for earning, multiple collections', async () => {
            const coin = await createCoin(coinService);

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const collection = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection.address,
                paymentToken: coin.address,
                txTime: Math.floor(new Date().getTime() / 1000),
                price: '1000000000000000000',
            });
            await createMintSaleTransaction(transactionService, {
                address: collection.address,
                txTime: Math.floor(new Date().getTime() / 1000),
                price: '1000000000000000000',
                paymentToken: coin.address,
            });
            const collection2 = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection2.address,
                txTime: Math.floor(new Date().getTime() / 1000),
                price: '1000000000000000000',
                paymentToken: coin.address,
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getAggregatedEarnings(organization.id);
            expect(result.monthly).toBe(tokenPriceUSD * 3);
            expect(result.weekly).toBe(tokenPriceUSD * 3);
            expect(result.daily).toBe(tokenPriceUSD * 3);
        });
    });

    describe('getOrganizationProfit', () => {
        it('should get profit by organization', async () => {
            const coin = await createCoin(coinService);

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const collection = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection.address,
                paymentToken: coin.address,
                price: '1000000000000000000',
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getOrganizationProfit(organization.id);
            expect(result.length).toBe(1);
            expect(result[0].paymentToken).toBe(coin.address);
            expect(result[0].inPaymentToken).toBe('1');
            expect(result[0].inUSDC).toBe(tokenPriceUSD.toString());
        });

        it('should used eth, if no coin is found', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const collection = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection.address,
                paymentToken: '0x0000000000000000000000000000000000000000',
                price: '1000000000000000000',
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getOrganizationProfit(organization.id);
            expect(result.length).toBe(1);
            expect(result[0].paymentToken).toBe('0x0000000000000000000000000000000000000000');
            expect(result[0].inPaymentToken).toBe('1');
            expect(result[0].inUSDC).toBe(tokenPriceUSD.toString());
        });

        it('should get profit by organization, multiple collections and multiple payment tokens', async () => {
            const coin = await createCoin(coinService);
            const coin2 = await createCoin(coinService, {
                address: faker.finance.ethereumAddress(),
                name: 'Wrapped Ether2',
                symbol: 'WETH2',
                derivedUSDC: 1,
            });

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const collection = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection.address,
                paymentToken: coin.address,
                price: '1000000000000000000',
            });
            const collection2 = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection2.address,
                paymentToken: coin2.address,
                price: '1000000000000000000',
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getOrganizationProfit(organization.id);
            expect(result.length).toBe(2);

            const filter1 = result.filter((item) => {
                return item.paymentToken == coin.address;
            });
            expect(filter1).toBeDefined();
            expect(filter1.length).toBe(1);
            expect(filter1[0].inPaymentToken).toBe('1');
            expect(filter1[0].inUSDC).toBe(tokenPriceUSD.toString());

            const filter2 = result.filter((item) => {
                return item.paymentToken == coin2.address;
            });
            expect(filter2).toBeDefined();
            expect(filter2.length).toBe(1);
            expect(filter2[0].inPaymentToken).toBe('1');
            expect(filter2[0].inUSDC).toBe(tokenPriceUSD.toString());
        });
    });

    describe('getLatestSales', () => {
        it('should be return latest sales', async () => {
            const coin = await createCoin(coinService);

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const collection = await createCollection(
                collectionService, { organization, address: faker.finance.ethereumAddress() });
            const tx1 = await createMintSaleTransaction(transactionService, {
                address: collection.address,
                paymentToken: coin.address,
                price: '1000000000000000000',
                txTime: Math.floor(new Date().getTime() / 1000),
            });
            const tx2 = await createMintSaleTransaction(transactionService, {
                address: collection.address,
                paymentToken: coin.address,
                price: '1000000000000000000',
                txTime: Math.floor(subSeconds(new Date(), 100).getTime() / 1000),
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getLatestSales(organization.id, '', '', 10, 10);
            expect(result).toBeDefined();
            expect(result.totalCount).toBe(2);
            expect(result.edges.length).toBe(2);
            expect(result.edges[0].node.txHash).toBe(tx1.txHash);
            expect(result.edges[1].node.txHash).toBe(tx2.txHash);
            expect(result.edges[0].node.txTime).toBeGreaterThan(result.edges[1].node.txTime);
        });

        it('should works well with pagination', async () => {
            const coin = await createCoin(coinService);

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const collection = await createCollection(
                collectionService, { organization, address: faker.finance.ethereumAddress() });
            for (let i = 0; i < 28; i++) {
                const txTime = Math.floor(subSeconds(new Date(), i * 100).getTime() / 1000);
                await createMintSaleTransaction(transactionService, {
                    address: collection.address,
                    paymentToken: coin.address,
                    price: '1000000000000000000',
                    txTime
                });
            }

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);
            const allPages = await service.getLatestSales(organization.id, '', '', 30, 10);
            expect(allPages).toBeDefined();
            expect(allPages.totalCount).toBe(28);

            const firstPage = await service.getLatestSales(organization.id, '', '', 10, 10);
            expect(firstPage).toBeDefined();
            expect(firstPage.edges.length).toBe(10);

            const secondPage = await service.getLatestSales(organization.id, '', firstPage.pageInfo.endCursor, 10, 10);
            expect(secondPage).toBeDefined();
            expect(secondPage.edges.length).toBe(10);

            const lastPage = await service.getLatestSales(organization.id, '', secondPage.pageInfo.endCursor, 10, 10);
            expect(lastPage).toBeDefined();
            expect(lastPage.edges.length).toBe(8);
        });
    });

    describe('getCollectionStat', () => {
        it('should return right collection stats for total, live, closed', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            // closed collection: endSaleAt is in the past
            const earlierPastTimestamp = Math.floor(subSeconds(new Date(), 200).getTime() / 1000);
            const pastTimestamp = Math.floor(subSeconds(new Date(), 100).getTime() / 1000);
            const futureTimestamp = Math.floor(addSeconds(new Date(), 200).getTime() / 1000);
            await createCollection(collectionService, {
                organization,
                address: faker.finance.ethereumAddress(),
                publishedAt: new Date(earlierPastTimestamp * 1000),
                beginSaleAt: earlierPastTimestamp,
                endSaleAt: pastTimestamp,
            });
            // live collection: it's within the [begin,end] time range and published already
            await createCollection(collectionService, {
                organization,
                address: faker.finance.ethereumAddress(),
                publishedAt: new Date(pastTimestamp * 1000),
                beginSaleAt: pastTimestamp,
                endSaleAt: futureTimestamp,
            });
            // draft collection, it's within the [begin,end] time range but not published yet
            await createCollection(collectionService, {
                organization,
                address: faker.finance.ethereumAddress(),
                beginSaleAt: pastTimestamp,
                endSaleAt: futureTimestamp,
            });
            const stats = await service.getCollectionStat(organization.id);
            expect(stats.total).toBe(3);
            expect(stats.live).toBe(1);
            expect(stats.closed).toBe(1);
        });

        it('should return 0 for collection stats if no collection', async () => {
            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });

            const organization = await createOrganization(service, { owner });
            const stats = await service.getCollectionStat(organization.id);
            expect(stats.total).toBe(0);
            expect(stats.live).toBe(0);
            expect(stats.closed).toBe(0);
        });
    });

    describe('getOrganizationEarningsChart', () => {
        it('should return the earnings chart', async () => {
            const coin = await createCoin(coinService);

            const owner = await userService.createUser({
                email: faker.internet.email(),
                password: 'password',
            });
            const organization = await createOrganization(service, { owner });
            const collection = await createCollection(collectionService, { organization });
            await createMintSaleTransaction(transactionService, {
                address: collection.address,
                paymentToken: coin.address,
                price: '1000000000000000000',
            });

            const tokenPriceUSD = faker.number.int({ max: 1000 });
            const mockPriceQuote: CoinQuotes = Object.assign(new CoinQuotes(), {
                USD: { price: tokenPriceUSD },
            });

            jest.spyOn(service['coinService'], 'getQuote').mockResolvedValue(mockPriceQuote);

            const result = await service.getOrganizationEarningsChart(organization.id, '', '', 10, 10);
            expect(result.totalCount).toBe(1);
            expect(result.edges).toBeDefined();
            expect(result.edges.length).toBe(1);
            expect(result.edges[0].node.volume).toEqual({
                inUSDC: tokenPriceUSD.toString(),
            });
        });
    });
});
