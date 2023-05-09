import { Injectable } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { User } from './user.entity';
import * as Sentry from '@sentry/node';
import { OrganizationService } from '../organization/organization.service';
import { OrganizationKind } from '../organization/organization.entity';
import * as randomstring from 'randomstring';

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
    async getUser(id: string): Promise<User> {
        return await this.userRepository.findOneBy({ id });
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
            const pseudoOrgName = randomstring.generate();
            const defaultOrgPayload = {
                name: pseudoOrgName,
                displayName: pseudoOrgName,
                kind: OrganizationKind.personal,
                owner: { id: user.id },
                invites: [{ email: user.email, canManage: true, canDeploy: true, canEdit: true }],
            };
            await this.organizationService.createOrganization(defaultOrgPayload);
            return user;
        } catch (e) {
            Sentry.captureException(e);
            if (e.routine === '_bt_check_unique') {
                throw new GraphQLError(`User already exists.`, {
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
            const { email, ...userProps } = payload;
            const userPayload = {
                email: email.toLowerCase(),
                ...userProps,
            };
            return this.userRepository.save(userPayload);
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
