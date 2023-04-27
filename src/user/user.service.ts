import { Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User } from './user.entity';

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
            throw new GraphQLError(e.message);
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
        if (!user) throw new Error(`User with id ${id} doesn't exist.`);
        return this.userRepository.save({ ...user, ...payload });
    }
}
