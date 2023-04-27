import { Resolver, Args, Query, Mutation } from '@nestjs/graphql';
import { Public } from '../lib/decorators/public.decorator';
import { UserService } from './user.service';
// import { User } from './user.entity';
import { User, UpdateUserInput } from './user.dto';

@Resolver('User')
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    @Public()
    @Query(() => User, { description: 'Returns an user for the given id', nullable: true })
    async user(@Args('id') id: string): Promise<User> {
        return await this.userService.getUser(id);
    }

    @Mutation(() => User, { description: 'update the given user.' })
    async updateUser(@Args('input') input: UpdateUserInput): Promise<User> {
        const { id } = input;
        return this.userService.updateUser(id, input);
    }
}
