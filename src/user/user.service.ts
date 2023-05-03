import { Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User } from './user.entity';
import * as Sentry from '@sentry/node';

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

    /**
     * Retrieve an user by id.
     * @param id
     * @returns
     */
    async getUser(id: string): Promise<User> {
        return await this.userRepository.findOneBy({ id });
    }

    /**
     * Creates a new user with the given data.
     *
     * @param payload
     * @returns The newly created user.
     */
    async createUser(payload: Partial<User>): Promise<User> {
        try {
            return this.userRepository.save(payload);
        } catch (e) {
            Sentry.captureException(e);
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
            Sentry.captureException(e);
            throw new GraphQLError(`Failed to update user ${id}`, {
                extensions: { code: 'INTERNAL_SERVER_ERROR' },
            });
        }
    }
}
