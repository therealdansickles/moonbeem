import { Injectable } from "@nestjs/common";
import { GraphQLError } from 'graphql';
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from "typeorm";
import { User } from './user.entity'

@Injectable()
export class UserService {
    constructor(@InjectRepository(User) private userRepository: Repository<User>) {}

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
}
