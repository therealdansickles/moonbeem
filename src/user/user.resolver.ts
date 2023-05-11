import { Resolver, Args, Query, Mutation, ResolveField, Parent } from '@nestjs/graphql';
import { Public } from '../lib/decorators/public.decorator';
import { UserService } from './user.service';
// import { User } from './user.entity';
import { User, UpdateUserInput } from './user.dto';
import { Membership } from '../membership/membership.dto';
import { MembershipService } from '../membership/membership.service';
import { Organization } from '../organization/organization.dto';
import { OrganizationService } from '../organization/organization.service';

@Resolver(() => User)
export class UserResolver {
    constructor(
        private readonly userService: UserService,
        private readonly membershipService: MembershipService,
        private readonly organizationService: OrganizationService
    ) {}

    @Public()
    @Query(() => User, { description: 'Returns an user for the given id or username', nullable: true })
    async user(
        @Args({ name: 'id', nullable: true }) id: string,
        @Args({ name: 'username', nullable: true }) username: string
    ): Promise<User> {
        return await this.userService.getUser({ id, username });
    }

    @Public()
    @Mutation(() => User, { description: 'update the given user.' })
    async updateUser(@Args('input') input: UpdateUserInput): Promise<User> {
        const { id } = input;
        return this.userService.updateUser(id, input);
    }

    @Public()
    @ResolveField(() => [Membership], { description: 'Returns the memberships for the given user' })
    async memberships(@Parent() user: User): Promise<Membership[]> {
        return await this.membershipService.getMembershipsByUserId(user.id);
    }

    @Public()
    @ResolveField(() => [Organization], { description: 'Returns the memberships for the given user' })
    async organizations(@Parent() user: User): Promise<Organization[]> {
        return await this.organizationService.getOrganizationsByOwnerId(user.id);
    }
}
