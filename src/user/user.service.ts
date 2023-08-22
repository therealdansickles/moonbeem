import { compareSync as verifyPassword } from 'bcryptjs';
import BigNumber from 'bignumber.js';
import { google } from 'googleapis';
import { GraphQLError } from 'graphql';
import { isEmpty, isNil, omitBy } from 'lodash';
import { IsNull, Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { captureException } from '@sentry/node';

import { Collection } from '../collection/collection.entity';
import { CollectionService } from '../collection/collection.service';
import { googleConfig } from '../lib/configs/app.config';
import { MailService } from '../mail/mail.service';
import { OrganizationService } from '../organization/organization.service';
import { fromCursor, PaginatedImp } from '../pagination/pagination.utils';
import { CoinService } from '../sync-chain/coin/coin.service';
import { MintSaleTransaction } from '../sync-chain/mint-sale-transaction/mint-sale-transaction.entity';
import { Tier } from '../tier/tier.entity';
import { Wallet } from '../wallet/wallet.entity';
import { CreateUserInput, LatestSalePaginated, PriceInfo, ResetPasswordOutput, UserProfit } from './user.dto';
import { User } from './user.entity';
import { generateRandomPassword } from './user.utils';

type IUserQuery = Partial<Pick<User, 'id' | 'username'>>;

@Injectable()
export class UserService {
    constructor(
        private organizationService: OrganizationService,
        private mailService: MailService,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Collection) private collectionRepository: Repository<Collection>,
        @InjectRepository(Tier) private tierRepository: Repository<Tier>,
        @InjectRepository(MintSaleTransaction, 'sync_chain')
        private mintSaleTransactionRepository: Repository<MintSaleTransaction>,
        private coinService: CoinService,
        private collectionService: CollectionService
    ) {}

    /**
     * Retrieves the user satisfied the given query.
     *
     * @param query The condition of the user to retrieve.
     * @returns The user satisfied the given query.
     */
    async getUserByQuery(query: IUserQuery): Promise<User> {
        query = omitBy(query, isNil);
        if (isEmpty(query)) return null;
        return this.userRepository.findOneBy(query);
    }

    /**
     * Create a new user with a default org / membership
     * the original `createUser` would be atomic service function
     *
     * @param payload
     * @param password
     * @returns The newly created user.
     */
    async createUserWithOrganization(input: CreateUserInput): Promise<User> {
        // check password for non Google-authenticated users
        if (input.provider === 'local' && !input.password) {
            throw new GraphQLError('Password must be provided for local users', {
                extensions: { code: 'BAD_USER_INPUT' },
            });
        }

        const user = await this.createUser(input);
        await this.organizationService.createPersonalOrganization(user);
        await this.mailService.sendVerificationEmail(user.email, user.verificationToken);
        return user;
    }

    /**
     * Onboard users with the given emails.
     * @param emails
     */
    async onboardUsers(emails: string[]): Promise<User[]> {
        // TODO: check if it's in the waitlist and isClaimed is false
        return await Promise.all(
            emails.map(async (email) => {
                const user = await this.createUser({ email, name: email, password: generateRandomPassword(12) });
                await this.organizationService.createPersonalOrganization(user);
                this.sendOnboardLink(email);
                return user;
            })
        );
    }

    /**
     * Creates a new user with the given data.
     *
     * @param payload
     * @returns The newly created user.
     */
    async createUser(payload: Partial<User>): Promise<User> {
        // only email is unique, so just need to check by email
        const existedUser = await this.userRepository.findOneBy({ email: payload.email });

        if (existedUser) {
            if (existedUser.provider !== payload.provider) {
                throw new GraphQLError(`An account with this email already exists. Please log in with ${existedUser.provider}.`);
            } else {
                throw new GraphQLError(`This email ${payload.email} is already taken.`);
            }
        }

        const user = this.userRepository.create(payload);
        await this.userRepository.insert(user);
        return await this.userRepository.findOneBy({ email: user.email });
    }

    /**
     * Verifies the given user and email.
     *
     * @param email The email of the user to verify.
     * @param token The verification token of the user to verify.
     * @returns The verified user.
     */
    async verifyUser(email: string, token: string): Promise<User> {
        const user = await this.userRepository.findOneBy({ email, verificationToken: token });
        if (!user) throw new GraphQLError(`Invalid verification token.`);

        await this.userRepository.save({ ...user, verifiedAt: new Date(), verificationToken: null });
        return await this.userRepository.findOneBy({ email: user.email });
    }

    /**
     * Send password reset link to the given email.
     * @param email The email of the user to send password reset link.
     */
    async sendPasswordResetLink(email: string): Promise<boolean> {
        const user = await this.userRepository.findOneBy({ email });
        if (!user)
            throw new GraphQLError(`No user registered with this email.`, {
                extensions: { code: 'NO_USER_FOUND' },
            });
        const verificationToken = user.generateVerificationToken();
        await this.userRepository.save({ ...user, verificationToken });
        this.mailService.sendPasswordResetEmail(user.email, verificationToken);
        return true;
    }

    async sendOnboardLink(email: string): Promise<boolean> {
        const user = await this.userRepository.findOneBy({ email });
        if (!user)
            throw new GraphQLError(`No user registered with this email.`, {
                extensions: { code: 'NO_USER_FOUND' },
            });
        const verificationToken = user.generateVerificationToken();
        await this.userRepository.save({ ...user, verificationToken });
        this.mailService.sendOnboardEmail(user.email, verificationToken);
        return true;
    }

    /**
     * Reset user password.
     * @param email The email of the user to redeem password reset token.
     * @param verificationToken The verification token of the user to redeem password reset token.
     * @param password The new password.
     * @returns
     */
    async resetUserPassword(email: string, verificationToken: string, password: string): Promise<ResetPasswordOutput> {
        const user = await this.userRepository.findOneBy({ email, verificationToken });
        if (!user)
            throw new GraphQLError(`Invalid verification token.`, {
                extensions: { code: 'INVALID_VERIFICATION_TOKEN' },
            });
        await this.userRepository.save({ ...user, password: user.hashPassword(password), verificationToken: null });
        // TODO: It's the legacy behavior, we can update it according to the current design
        return { code: 'SUCCESS' };
    }

    /**
     *
     * @param id
     * @param payload
     * @returns
     */
    async updateUser(id: string, payload: Partial<Omit<User, 'id | createdAt | updatedAt'>>): Promise<User> {
        const user = await this.userRepository.findOneBy({ id });
        if (!user) {
            throw new GraphQLError(`User with id ${id} doesn't exist.`, {
                extensions: { code: 'BAD_REQUEST' },
            });
        }

        try {
            return this.userRepository.save({ ...user, ...payload });
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to update user ${id}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Verify user credentials.
     *
     * @param email user email
     * @param password user hashed password
     *
     * @returns The user if credentials are valid.
     */
    async authenticateUser(email: string, password: string): Promise<User | null> {
        // checking the email has been used for `Sign in with Google`
        const signedInByGmail = await this.userRepository.findOneBy({ gmail: email.toLowerCase(), password: IsNull() });
        if (signedInByGmail) throw new GraphQLError(`This email has been used for Google sign in. Please sign in with Google.`);

        const user = await this.userRepository.findOneBy({ email: email.toLowerCase() });

        if (user && (await verifyPassword(password, user.password))) {
            return user;
        }

        return null;
    }

    /**
     * Verify user credentials.
     * @param accessToken user access token
     * @returns The user if credentials are valid.
     */
    private async authenticateFromGoogle(accessToken: string): Promise<{ gmail: string; name: string; avatarUrl?: string }> {
        try {
            const googleClient = new google.auth.OAuth2({ clientId: googleConfig.clientId });
            const tokenInfo = await googleClient.getTokenInfo(accessToken);
            if (!tokenInfo || tokenInfo.aud != googleConfig.clientId) {
                throw new Error('Field to getTokenInfo.');
            }
            googleClient.setCredentials({ access_token: accessToken });
            const userInfo = await google.oauth2({ auth: googleClient, version: 'v2' }).userinfo.get();
            if (!userInfo || userInfo.status != 200) {
                throw new Error('Failed to get information from accessToken.');
            }
            const gmail = userInfo.data?.email?.toLowerCase();
            if (!gmail) {
                throw new Error('google account not bound email.');
            }

            return { gmail, name: userInfo.data.name, avatarUrl: userInfo.data.picture };
        } catch (err) {
            captureException(err);
            throw new GraphQLError(`Failed to verify accessToken, ${(err as Error).message}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * authenticateUser from Google OAuth mechanism
     *
     * @param accessToken
     * @returns
     */
    async authenticateUserFromGoogle(accessToken: string): Promise<User | null> {
        const { gmail, name, avatarUrl } = await this.authenticateFromGoogle(accessToken);

        const existedUser = await this.userRepository.findOneBy({ email: gmail, gmail: IsNull() });
        if (existedUser) await this.userRepository.update({ id: existedUser.id }, { gmail });
        const existedGmailUser = await this.userRepository.findOneBy({ gmail });
        if (existedGmailUser) {
            return existedGmailUser;
        } else {
            const userData = {
                email: gmail,
                gmail,
                name,
                avatarUrl,
                provider: 'google',
            };
            await this.createUserWithOrganization(userData);
            return this.userRepository.findOneBy({ email: gmail });
        }
    }

    /**
     * Total Profit from Acquiring Users
     *
     * @param id user id
     * @returns profit in payment token and usd
     */
    async getUserProfit(id: string): Promise<UserProfit[]> {
        const collections = await this.collectionService.getCollectionsByUserId(id);
        if (collections.length == 0) return [];

        const result: PriceInfo[] = await this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select('SUM("txn".price::decimal(30,0))', 'price')
            .addSelect('txn.paymentToken', 'token')
            .where('txn.address IN (:...addresses)', {
                addresses: collections.map((c) => {
                    if (c.address) return c.address;
                }),
            })
            .groupBy('txn.paymentToken')
            .getRawMany();

        const data = await Promise.all(
            result.map(async (item) => {
                const coin = await this.coinService.getCoinByAddress(item.token);
                const totalTokenPrice = new BigNumber(item.price).div(new BigNumber(10).pow(coin.decimals));
                const quote = await this.coinService.getQuote(coin.symbol);
                const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(quote['USD'].price);
                return {
                    inPaymentToken: totalTokenPrice.toString(),
                    inUSDC: totalUSDC.toString(),
                };
            })
        );
        return data;
    }

    /**
     * get total collections for the given user.
     *
     * @param id user id
     * @returns collection count
     */
    async getTotalCollections(id: string): Promise<number> {
        const total = await this.collectionRepository
            .createQueryBuilder('collection')
            .leftJoinAndSelect(Wallet, 'wallet', 'collection.creatorId = wallet.id')
            .leftJoinAndSelect(User, 'user', 'wallet.ownerId = user.id')
            .where('user.id = :id', { id })
            .getCount();
        return total;
    }

    /**
     * get unique buyers for the given user. Anyone who has minted a collection created by this user.
     *
     * @param id user id
     * @returns unique buyers
     */
    async getUniqueBuyers(id: string): Promise<number> {
        const collections = await this.collectionService.getCollectionsByUserId(id);
        if (collections.length == 0) return 0;

        const { total } = await this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select('COUNT(DISTINCT(txn.recipient))', 'total')
            .where('txn.address IN (:...addresses)', {
                addresses: collections.map((c) => {
                    if (c.address) return c.address;
                }),
            })
            .getRawOne();
        return parseInt(total);
    }

    /**
     * get total sold for the given user. the number of sold nft's in all collections created by this user.
     *
     * @param id user id
     * @returns total number of item sold
     */
    async getItemSold(id: string): Promise<number> {
        const collections = await this.collectionService.getCollectionsByUserId(id);
        if (collections.length == 0) return 0;

        const { total } = await this.mintSaleTransactionRepository
            .createQueryBuilder('txn')
            .select('COUNT(1)', 'total')
            .where('txn.address IN (:...addresses)', {
                addresses: collections.map((c) => {
                    if (c.address) return c.address;
                }),
            })
            .getRawOne();
        return parseInt(total);
    }

    /**
     * sales histories in all collections created by this user
     *
     * @param id user id
     * @param before before cursor
     * @param after after cursor
     * @param first first limit
     * @param last limit
     * @returns LatestSalePaginated object
     */
    async getLatestSales(id: string, before: string, after: string, first: number, last: number): Promise<LatestSalePaginated> {
        const collections = await this.collectionService.getCollectionsByUserId(id);
        if (collections.length == 0) return PaginatedImp([], 0);

        const addresses = collections.map((c) => {
            if (c.address) return c.address;
        });

        if (addresses.length > 0) {
            const builder = await this.mintSaleTransactionRepository
                .createQueryBuilder('txn')
                .select('txn.txHash', 'txHash')
                .addSelect('COUNT(1)', 'quantity')
                .addSelect('SUM("txn".price::decimal(30,0))', 'totalPrice')
                .addSelect('txn.recipient', 'recipient')
                .addSelect('txn.txTime', 'txTime')
                .addSelect('txn.tierId', 'tierId')
                .addSelect('txn.address', 'address')
                .addSelect('txn.paymentToken', 'paymentToken')
                .where('txn.address IN (:...addresses)', { addresses })
                .groupBy('txn.txHash')
                .addGroupBy('txn.txTime')
                .addGroupBy('txn.recipient')
                .addGroupBy('txn.tierId')
                .addGroupBy('txn.address')
                .addGroupBy('txn.paymentToken');

            if (after) {
                builder.andWhere('asset.txTime > :cursor', { cursor: new Date(fromCursor(after)).valueOf() / 1000 });
                builder.limit(first);
            } else if (before) {
                builder.andWhere('asset.txTime < :cursor', { cursor: fromCursor(before) });
                builder.limit(last);
            } else {
                const limit = Math.min(first, builder.expressionMap.take || Number.MAX_SAFE_INTEGER);
                builder.limit(limit);
            }

            const subquery = this.mintSaleTransactionRepository
                .createQueryBuilder('txn')
                .select('txn.recipient', 'recipient')
                .where('txn.address IN (:...addresses)', { addresses })
                .groupBy('txn.recipient')
                .addGroupBy('txn.address')
                .addGroupBy('txn.tierId');

            const [result, totalResult] = await Promise.all([
                builder.getRawMany(),
                this.mintSaleTransactionRepository.manager.query(
                    `SELECT COUNT(1) AS "total"
                     FROM (${subquery.getSql()}) AS subquery`,
                    addresses
                ),
            ]);

            const dd = await Promise.all(
                result.map(async (item) => {
                    const { tierId, paymentToken, totalPrice, quantity, ...rest } = item;
                    const collection = collections.find((c) => c.address == item.address);
                    const tier = await this.tierRepository.findOneBy({
                        tierId: tierId,
                        collection: { id: collection.id },
                    });
                    const coin = await this.coinService.getCoinByAddress(paymentToken);
                    const quote = await this.coinService.getQuote(coin.symbol);
                    const totalTokenPrice = new BigNumber(totalPrice).div(new BigNumber(10).pow(coin.decimals));
                    const totalUSDC = new BigNumber(totalTokenPrice).multipliedBy(quote['USD'].price);

                    const createdAt = new Date(item.txTime * 1000);
                    return {
                        quantity: parseInt(quantity),
                        ...rest,
                        tier,
                        collection,
                        paymentToken,
                        totalPrice: {
                            inPaymentToken: totalTokenPrice.toString(),
                            inUSDC: totalUSDC.toString(),
                        },
                        createdAt: new Date(createdAt.getTime() + createdAt.getTimezoneOffset() * 60 * 1000),
                    };
                })
            );
            return PaginatedImp(dd, totalResult.length > 0 ? parseInt(totalResult[0].total ?? 0) : 0);
        }

        return PaginatedImp([], 0);
    }
}
