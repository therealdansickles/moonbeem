import { Args, Int, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthorizedUser, Public, SessionUser } from '../session/session.decorator';
import { UserService } from './user.service';
import {
    CreateUserInput,
    LatestSalePaginated,
    OnboardUsersInput,
    PasswordResetLinkInput,
    ResetPasswordInput,
    ResetPasswordOutput,
    UpdateUserInput,
    User,
    UserProfit,
    VerifyUserInput,
} from './user.dto';
import { Membership } from '../membership/membership.dto';
import { MembershipService } from '../membership/membership.service';
import { Organization } from '../organization/organization.dto';
import { OrganizationService } from '../organization/organization.service';
import { SigninByEmailGuard, VibeEmailGuard } from '../session/session.guard';
import { ForbiddenException, UseGuards } from '@nestjs/common';

@Resolver(() => User)
export class UserResolver {
    constructor(
        private readonly userService: UserService,
        private readonly membershipService: MembershipService,
        private readonly organizationService: OrganizationService,
    ) {}

    @UseGuards(SigninByEmailGuard)
    @Query(() => User, { description: 'Returns an user for the given id or username', nullable: true })
    async user(@Args({ name: 'id', nullable: true }) id: string, @Args({ name: 'username', nullable: true }) username: string): Promise<User> {
        return await this.userService.getUserByQuery({ id, username });
    }

    @Public()
    @Mutation(() => User, { description: 'create a new user with a default organization.' })
    async createUser(@Args('input') input: CreateUserInput): Promise<User> {
        return await this.userService.createUserWithOrganization(input);
    }

    @AuthorizedUser('id')
    @Mutation(() => User, { description: 'update the given user.' })
    async updateUser(@Args('input') input: UpdateUserInput): Promise<User> {
        const { id } = input;
        return this.userService.updateUser(id, input);
    }

    @Public()
    @Mutation(() => User, { description: 'verify the given user.' })
    async verifyUser(@Args('input') input: VerifyUserInput): Promise<User> {
        return this.userService.verifyUser(input.email, input.verificationToken);
    }

    @Public()
    @Mutation(() => Boolean, { description: 'Send the reset password link to the user' })
    async sendPasswordResetLink(@Args('input') input: PasswordResetLinkInput): Promise<boolean> {
        return this.userService.sendPasswordResetLink(input.email);
    }

    @UseGuards(VibeEmailGuard)
    @Mutation(() => [User], { description: 'Onboard users' })
    async onboardUsers(@Args('input') input: OnboardUsersInput): Promise<User[]> {
        return this.userService.onboardUsers(input.emails);
    }

    @Public()
    @Mutation(() => ResetPasswordOutput, { description: 'Reset the user password' })
    async resetPassword(@Args('input') input: ResetPasswordInput): Promise<ResetPasswordOutput> {
        return this.userService.resetUserPassword(input.email, input.verificationToken, input.password);
    }

    @Public()
    @Query(() => String, { description: 'Get the user reset password link' })
    async getResetPasswordLink(@SessionUser() user): Promise<string> {
        if (!user) {
            throw new ForbiddenException('Forbidden resource');
        }
        return this.userService.getPasswordResetLink(user);
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

    @Public()
    @ResolveField(() => [UserProfit], { description: 'Returns the total raised for the given user.' })
    async profit(@Parent() user: User): Promise<UserProfit[]> {
        return await this.userService.getUserProfit(user.id);
    }

    @Public()
    @ResolveField(() => Int, { description: 'Returns the total collections for the given user.' })
    async totalCollections(@Parent() user: User): Promise<number> {
        return await this.userService.getTotalCollections(user.id);
    }

    @Public()
    @ResolveField(() => Int, { description: 'Returns the unique buyers for the given user.' })
    async uniqueBuyers(@Parent() user: User): Promise<number> {
        return await this.userService.getUniqueBuyers(user.id);
    }

    @Public()
    @ResolveField(() => Int, { description: 'Returns the total sold for the given user.' })
    async itemSold(@Parent() user: User): Promise<number> {
        return await this.userService.getItemSold(user.id);
    }

    @Public()
    @ResolveField(() => LatestSalePaginated, { description: 'Returns the latest sales list for the given user.' })
    async latestSales(
        @Parent() user: User,
        @Args('before', { nullable: true }) before?: string,
        @Args('after', { nullable: true }) after?: string,
        @Args('first', { type: () => Int, nullable: true, defaultValue: 10 }) first?: number,
        @Args('last', { type: () => Int, nullable: true, defaultValue: 10 }) last?: number,
    ): Promise<LatestSalePaginated> {
        return await this.userService.getLatestSales(user.id, before, after, first, last);
    }

    @Public()
    @Mutation(() => User, { description: 'Accept plugin invitation' })
    async acceptPluginInvitation(@SessionUser() user, @Args('pluginInviteCode') pluginInviteCode: string): Promise<User> {
        if (!user) {
            throw new ForbiddenException('Forbidden resource');
        }
        return this.userService.acceptPluginInvitation(user, pluginInviteCode);
    }
}
