import { faker } from '@faker-js/faker';
import { CollectionKind } from './collection/collection.entity';
import { CollectionService } from './collection/collection.service';
import { OrganizationService } from './organization/organization.service';
import { Asset721Service } from './sync-chain/asset721/asset721.service';
import { CoinService } from './sync-chain/coin/coin.service';
import { History721Type } from './sync-chain/history721/history721.entity';
import { History721Service } from './sync-chain/history721/history721.service';
import { MintSaleContractService } from './sync-chain/mint-sale-contract/mint-sale-contract.service';
import { MintSaleTransactionService } from './sync-chain/mint-sale-transaction/mint-sale-transaction.service';
import { RoyaltyService } from './sync-chain/royalty/royalty.service';
import { TierService } from './tier/tier.service';
import { MembershipService } from './membership/membership.service';
import { CreateMembershipInput } from './membership/membership.dto';
import { gql } from './user/user.resolver.spec';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';

export const createCoin = async (coinService: CoinService, coin?: any) =>
    coinService.createCoin({
        address: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1',
        name: 'Wrapped Ether',
        symbol: 'WETH',
        decimals: 18,
        derivedETH: 1,
        derivedUSDC: 1.5,
        enabled: true,
        chainId: 1,
        ...coin,
    });

export const createCollection = async (collectionService: CollectionService, collection?: any) =>
    collectionService.createCollection({
        name: faker.company.name(),
        displayName: faker.company.name(),
        about: faker.company.name(),
        tags: [],
        kind: CollectionKind.edition,
        address: faker.finance.ethereumAddress(),
        ...collection,
    });

export const createTier = async (tierService: TierService, tier?: any) =>
    tierService.createTier({
        name: faker.company.name(),
        totalMints: 100,
        collection: { id: faker.string.uuid() },
        price: '100',
        paymentTokenAddress: faker.finance.ethereumAddress(),
        tierId: 0,
        metadata: {},
        ...tier,
    });

export const createMintSaleContract = async (contractService: MintSaleContractService, contract?: any) =>
    contractService.createMintSaleContract({
        height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
        txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
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
        price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
        paymentToken: faker.finance.ethereumAddress(),
        startId: 1,
        endId: 100,
        currentId: 1,
        tokenAddress: faker.finance.ethereumAddress(),
        collectionId: faker.string.uuid(),
        ...contract,
    });

export const createAsset721 = async (asset721Service: Asset721Service, asset721?: any) =>
    asset721Service.createAsset721({
        height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
        txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
        txTime: Math.floor(faker.date.recent().getTime() / 1000),
        address: faker.finance.ethereumAddress(),
        tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
        owner: faker.finance.ethereumAddress(),
        ...asset721,
    });

export const createMintSaleTransaction = async (transactionService: MintSaleTransactionService, transaction?: any) =>
    transactionService.createMintSaleTransaction({
        height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
        txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
        txTime: Math.floor(faker.date.recent().getTime() / 1000),
        sender: faker.finance.ethereumAddress(),
        recipient: faker.finance.ethereumAddress(),
        tierId: 0,
        tokenAddress: faker.finance.ethereumAddress(),
        tokenId: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
        price: faker.string.numeric({ length: { min: 18, max: 19 }, allowLeadingZeros: false }),
        address: faker.finance.ethereumAddress(),
        collectionId: faker.string.uuid(),
        paymentToken: faker.finance.ethereumAddress(),
        ...transaction,
    });

export const createOrganization = async (organizationService: OrganizationService, organization?: any) =>
    organizationService.createOrganization({
        name: faker.company.name(),
        displayName: faker.company.name(),
        about: faker.company.catchPhrase(),
        avatarUrl: faker.image.url(),
        backgroundUrl: faker.image.url(),
        websiteUrl: faker.internet.url(),
        twitter: faker.internet.userName(),
        instagram: faker.internet.userName(),
        discord: faker.internet.userName(),
        ...organization,
    });

export const createMemberships = async (membershipService: MembershipService, membershipInput?: CreateMembershipInput) =>
    membershipService.createMemberships({
        emails: [faker.internet.email()],
        organizationId: faker.string.uuid(),
        canEdit: true,
        canDeploy: true,
        canManage: true,
        ...membershipInput,
    });

export const createRoyalty = async (service: RoyaltyService, royalty?: any) =>
    service.createRoyalty({
        height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
        txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
        txTime: Math.floor(faker.date.recent().getTime() / 1000),
        sender: faker.finance.ethereumAddress(),
        address: faker.finance.ethereumAddress(),
        userAddress: faker.finance.ethereumAddress(),
        userRate: faker.string.numeric({ length: 3, allowLeadingZeros: false }),
        ...royalty,
    });

export const createHistory721 = async (service: History721Service, history?: any) =>
    service.createHistory721({
        height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
        txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
        txTime: Math.floor(faker.date.recent().getTime() / 1000),
        address: faker.finance.ethereumAddress(),
        tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
        sender: faker.finance.ethereumAddress(),
        receiver: faker.finance.ethereumAddress(),
        kind: History721Type.unknown,
        ...history,
    });

/**
 * Get token from email, the user must be created before
 * @param app
 * @param email
 */
export const getToken = async (app: INestApplication, email: string) => {
    const tokenQuery = gql`
        mutation CreateSessionFromEmail($input: CreateSessionFromEmailInput!) {
            createSessionFromEmail(input: $input) {
                token
                user {
                    id
                    email
                }
            }
        }
    `;

    const tokenVariables = {
        input: {
            email,
            password: 'password',
        },
    };

    const tokenRs = await request(app.getHttpServer()).post('/graphql').send({ query: tokenQuery, variables: tokenVariables });

    const { token } = tokenRs.body.data.createSessionFromEmail;
    return token;
};
