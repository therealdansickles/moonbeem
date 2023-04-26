import { Resolver, Args, Mutation } from '@nestjs/graphql';
import { UserService } from './user.service';
// import { User } from './user.entity';
import { User, UpdateUserInput } from './user.dto';

@Resolver('User')
export class UserResolver {
    constructor(private readonly userService: UserService) {}

    @Mutation(() => User, { description: 'update the given user.' })
    async updateUser(@Args('input') input: UpdateUserInput): Promise<User> {
        const { id } = input;
        return this.userService.updateUser(id, input);
    }
}
