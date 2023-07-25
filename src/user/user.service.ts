import { compareSync as verifyPassword } from 'bcryptjs';
import { google } from 'googleapis';
import { GraphQLError } from 'graphql';
import { isEmpty, isNil, omitBy } from 'lodash';
import { Repository } from 'typeorm';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { captureException } from '@sentry/node';

import { googleConfig } from '../lib/configs/app.config';
import { MailService } from '../mail/mail.service';
import { OrganizationService } from '../organization/organization.service';
import { User } from './user.entity';

type IUserQuery = Partial<Pick<User, 'id' | 'username'>>;

@Injectable()
export class UserService {
    constructor(
        private organizationService: OrganizationService,
        private mailService: MailService,
        @InjectRepository(User) private userRepository: Repository<User>
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
     * @returns The newly created user.
     */
    async createUserWithOrganization(payload: Partial<User>): Promise<User> {
        const user = await this.createUser(payload);
        await this.organizationService.createPersonalOrganization(user);
        await this.mailService.sendWelcomeEmail(user.email, {});
        return user;
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
        if (existedUser) throw new GraphQLError(`This email ${payload.email} is already taken.`);

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
        const user = await this.userRepository.findOneBy({ email });

        if (user && (await verifyPassword(password, user.password))) {
            return user;
        }

        return null;
    }

    /**
     * Verify user credentials.
     *
     * @param email user email
     * @param password user hashed password
     *
     * @returns The user if credentials are valid.
     */
    async authenticateUserFromGoogle(accessToken: string): Promise<User | null> {
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
            if (!userInfo.data.email) {
                throw new Error('google account not bound email.');
            }

            const existedUser = await this.userRepository.findOneBy({ email: userInfo.data.email });
            if (existedUser) {
                return existedUser;
            } else {
                const userData = {
                    email: userInfo.data.email,
                    name: userInfo.data.name,
                    avatarUrl: userInfo.data.picture,
                };
                await this.createUserWithOrganization(userData);
                return this.userRepository.findOneBy({ email: userInfo.data.email });
            }
        } catch (err) {
            captureException(err);
            throw new GraphQLError(`Failed to verify accessToken, ${(err as Error).message}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }
}
