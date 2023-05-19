import { Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User } from './user.entity';
import { captureException } from '@sentry/node';
import { OrganizationService } from '../organization/organization.service';
import { OrganizationKind } from '../organization/organization.entity';
import * as randomstring from 'randomstring';
import { compareSync as verifyPassword } from 'bcryptjs';

interface GetUserInput {
    id?: string;
    username?: string;
}

@Injectable()
export class UserService {
    constructor(
        private organizationService: OrganizationService,
        @InjectRepository(User) private userRepository: Repository<User>
    ) {}

    /**
     * Retrieve an user by id.
     * @param id
     * @returns
     */
    async getUser(input: GetUserInput): Promise<User> {
        if (!input.id && !input.username) {
            throw new GraphQLError("Either 'id' or 'username' have to be provided.", {
                extensions: { code: 'BAD_REQUEST' },
            });
        }
        return await this.userRepository.findOneBy(input);
    }

    /**
     * Create a new user with a default org / membership
     * the original `createUser` would be atomic service function
     *
     * @param payload
     * @returns The newly created user.
     */
    async createUserWithOrganization(payload: Partial<User>): Promise<User> {
        try {
            const user = await this.createUser(payload);
            await this.organizationService.createPersonalOrganization(user);
            return user;
        } catch (e) {
            captureException(e);
            if (e.routine === '_bt_check_unique') {
                throw new GraphQLError('User already exists.', {
                    extensions: { code: 'BAD_REQUEST' },
                });
            }

            throw new GraphQLError(`Failed to create user ${payload.name} with organization`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }

    /**
     * Creates a new user with the given data.
     *
     * @param payload
     * @returns The newly created user.
     */
    async createUser(payload: Partial<User>): Promise<User> {
        try {
            await this.userRepository.insert(payload);
            return await this.userRepository.findOneBy({ email: payload.email });
        } catch (e) {
            captureException(e);
            throw new GraphQLError(`Failed to create user ${payload.name}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
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
    async verifyUser(email: string, password: string): Promise<User | null> {
        const user = await this.userRepository.findOneBy({ email });

        if (user && (await verifyPassword(user.password, password))) {
            return user;
        }

        return null;
    }
}
