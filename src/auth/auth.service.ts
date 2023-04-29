import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ethers } from 'ethers';
import {
    LoginWithEmailResponse,
    CreateUserWithEmailInput,
    LoginWithWalletResponse,
    LoginWithEmailInput,
} from './auth.dto';
import { RedisAdapter } from '../lib/adapters/redis.adapter';
import { JWTService } from '../services/jwt.service';
import { UserWalletService } from '../services/user.wallet.service';
import * as argon from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { Repository } from 'typeorm';
import { Wallet } from '../wallet/wallet.entity';
import { GraphQLError } from 'graphql';

export const SESSION_PERFIX = 'login_session';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JWTService,
        private readonly redisClient: RedisAdapter,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(Wallet) private walletRepository: Repository<Wallet>
    ) {}

    /**
     * login with wallet, needs to signature
     * @param address user address, lowercase is recommended
     * @param message signed message content
     * @param signature information returned by the signature
     * @returns session and basic wallet information
     */
    async loginWithWallet(address: string, message: string, signature: string): Promise<LoginWithWalletResponse> {
        // verify message
        const _address = ethers.utils.verifyMessage(message, signature);
        if (address.toLowerCase() !== _address.toLocaleLowerCase()) {
            throw new GraphQLError('Signature verification failed.', { extensions: { code: 'BAD_REQUEST' } });
        }

        // check address exists
        let wallet = await this.walletRepository.findOne({ where: { address: address.toLowerCase() } });
        if (!wallet) {
            const walletPayload = {
                address: address.toLowerCase(),
            } as unknown as Wallet;

            wallet = await this.walletRepository.save(walletPayload);
        }

        if (wallet.address !== address.toLowerCase()) {
            throw new GraphQLError('Address not found.', { extensions: { code: 'BAD_REQUEST' } });
        }

        // generate token and save token
        const authPayload: AuthPayload = {
            id: wallet.id,
            address,
            signature,
        };
        const accessToken = this.jwtService.createToken(authPayload);

        // save redis
        const _key = this.redisClient.getKey(address, SESSION_PERFIX);
        await this.redisClient.set(_key, accessToken);

        const { createdAt, updatedAt, ...returnWallet } = wallet;

        return {
            sessionToken: accessToken,
            item: returnWallet,
        };
    }

    /**
     * logout, needs to session
     * @param identifier the identifier of the user
     * @returns boolean
     */
    async logout(identifier: string): Promise<boolean> {
        if (!identifier) {
            throw new GraphQLError('No identifier found.', { extensions: { code: 'BAD_REQUEST' } });
        }

        const _key = this.redisClient.getKey(identifier.toLocaleLowerCase(), SESSION_PERFIX);
        const val = this.redisClient.get(_key);
        if (!val) return true;
        await this.redisClient.delete(_key);
        return true;
    }

    /**
     * creates a user with email/password
     * @param data CreateUserWithEmailInput
     * @returns session and basic user information
     */
    async createUserWithEmail(data: CreateUserWithEmailInput): Promise<LoginWithEmailResponse> {
        // generate the password hash
        const hash = await argon.hash(data.password);

        // save the new user to db
        try {
            const userPayload = {
                email: data.email.toLowerCase(),
                password: hash,
                name: data.name,
                username: data.username,
                avatarUrl: data.avatarUrl,
            } as unknown as User;

            const user = await this.userRepository.save(userPayload);

            // return the saved user
            const authPayload: AuthPayload = {
                id: user.id,
                email: user.email,
            };

            const accessToken = this.jwtService.createToken(authPayload);
            const _key = this.redisClient.getKey(user.email.toLowerCase(), SESSION_PERFIX);
            await this.redisClient.set(_key, accessToken);

            const { password, createdAt, updatedAt, ...returnUser } = user;

            return {
                sessionToken: accessToken,
                user: returnUser,
            };
        } catch (e) {
            throw new GraphQLError('Failed to create user.', {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * login with wallet, needs to signature
     * @param email user email, lowercase is recommended
     * @param password user password
     * @returns session and basic user information
     */
    async loginWithEmail(data: LoginWithEmailInput): Promise<LoginWithEmailResponse> {
        const user = await this.userRepository.findOne({
            where: {
                email: data.email.toLowerCase(),
            },
        });

        if (!user) {
            throw new GraphQLError('Verification failed. Please check your username or password and try again.', {
                extensions: { code: 'UNAUTHORIZED' },
            });
        }

        const pwMatches = await argon.verify(user.password, data.password);
        if (!pwMatches) {
            throw new GraphQLError('Verification failed. Please check your username or password and try again.', {
                extensions: { code: 'UNAUTHORIZED' },
            });
        }

        const authPayload: AuthPayload = {
            id: user.id,
            email: user.email,
        };

        const accessToken = this.jwtService.createToken(authPayload);
        const _key = this.redisClient.getKey(user.email.toLowerCase(), SESSION_PERFIX);
        await this.redisClient.set(_key, accessToken);

        const { password, createdAt, updatedAt, ...returnUser } = user;

        return {
            sessionToken: accessToken,
            user: returnUser,
        };
    }
}

export interface AuthPayload {
    id: string;
    address?: string;
    signature?: string;
    email?: string;
}
