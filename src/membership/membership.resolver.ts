import { Public } from '../session/session.decorator';
import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';

import {
    Membership,
    CreateMembershipInput,
    UpdateMembershipInput,
    DeleteMembershipInput,
    MembershipRequestInput,
} from './membership.dto';
import { MembershipService } from './membership.service';
import { OrganizationService } from '../organization/organization.service';
import { MailService } from '../mail/mail.service';
import { SigninByEmailGuard } from '../session/session.guard';
import { UseGuards } from '@nestjs/common';

@Resolver(() => Membership)
export class MembershipResolver {
    constructor(
        private readonly membershipService: MembershipService,
        private readonly organizationService: OrganizationService,
        private mailService: MailService
    ) {}

    @Public()
    @Query(() => Membership, { description: 'Retrieve a membership by id.', nullable: true })
    async membership(@Args('id') id: string): Promise<Membership> {
        return await this.membershipService.getMembership(id);
    }

    @Mutation(() => Membership, { description: 'Create a new membership.' })
    async createMembership(@Args('input') input: CreateMembershipInput): Promise<Membership> {
        return await this.membershipService.createMembership(input);
    }

    @UseGuards(SigninByEmailGuard)
    @Mutation(() => Boolean, { description: 'Accept a membership request.' })
    async acceptMembership(@Args('input') input: MembershipRequestInput): Promise<boolean> {
        return await this.membershipService.acceptMembership(input);
    }

    @Mutation(() => Boolean, { description: 'Accept a membership request.' })
    async declineMembership(@Args('input') input: MembershipRequestInput): Promise<boolean> {
        return await this.membershipService.declineMembership(input);
    }

    @Mutation(() => Membership, { description: 'Update a membership.' })
    async updateMembership(@Args('input') input: UpdateMembershipInput): Promise<Membership> {
        const { id } = input;
        return await this.membershipService.updateMembership(id, input);
    }

    @Mutation(() => Boolean, { description: 'Deletes a membership.' })
    async deleteMembership(@Args('input') input: DeleteMembershipInput): Promise<boolean> {
        const { id } = input;
        return await this.membershipService.deleteMembership(id);
    }

    @Public()
    @Query(() => [Membership])
    async memberships(@Args('userId') userId: string): Promise<Membership[]> {
        return await this.membershipService.getMembershipsByUserId(userId);
    }
}
