import { Field, ID, InputType, Int, ObjectType, OmitType, PartialType, PickType } from '@nestjs/graphql';
import { IsBoolean, IsDateString, IsNumber, IsObject, IsOptional, IsString, IsUrl, ValidateIf } from 'class-validator';
import Paginated from '../pagination/pagination.dto';
import { Profit } from '../tier/tier.dto';
import { LatestSaleData, User, UserInput } from '../user/user.dto';

@ObjectType('Organization')
export class Organization {
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @Field(() => User, { description: 'The owner of the organization.' })
    readonly owner: User;

    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a organization.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The name that we display for the organization.' })
    readonly displayName: string;

    @IsOptional()
    @Field(() => String, {
        description: "The type of organization this is. e.g 'personal', 'general'.",
        nullable: true,
    })
    readonly kind?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the organization.', nullable: true })
    readonly about?: string;

    @IsOptional()
    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the organization. This is the profile picture.',
        nullable: true,
    })
    readonly avatarUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the organization.', nullable: true })
    readonly backgroundUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this organization', nullable: true })
    readonly websiteUrl?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly twitter?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    readonly instagram?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this organization, e.g. 'vibe-labs", nullable: true })
    readonly discord?: string;

    @IsDateString()
    @Field({ description: 'The DateTime that this organization was created(initially created as a draft).' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this organization was last updated.' })
    readonly updatedAt: Date;
}

@InputType('CreateOrganizationInput')
export class CreateOrganizationInput {
    @IsString()
    @Field({ description: 'The unique URL-friendly identifier for a organization.' })
    readonly name: string;

    @IsObject()
    @Field(() => UserInput, { description: 'The owner of the organization.' })
    readonly owner: UserInput;

    @IsString()
    @Field({ description: 'The name that we display for the organization.', nullable: true })
    @IsOptional()
    readonly displayName?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The description for the organization.', nullable: true })
    @IsOptional()
    readonly about?: string;

    @IsUrl()
    @Field({
        description: 'The image url for the avatar of the organization. This is the profile picture.',
        nullable: true,
    })
    readonly avatarUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The image url for the background of the organization.', nullable: true })
    @IsOptional()
    readonly backgroundUrl?: string;

    @IsUrl()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: 'The url for the website associated with this organization', nullable: true })
    @IsOptional()
    readonly websiteUrl?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The twitter handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    @IsOptional()
    readonly twitter?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The instagram handle associated with this organization, e.g. 'vibe-labs'", nullable: true })
    @IsOptional()
    readonly instagram?: string;

    @IsString()
    @ValidateIf((object, value) => value !== null)
    @Field({ description: "The discord handle associated with this organization, e.g. 'vibe-labs", nullable: true })
    @IsOptional()
    readonly discord?: string;
}

@InputType('OrganizationInviteItemInput')
export class OrganizationInviteItemInput {
    @IsString()
    @Field({ description: 'emails to invite to the org.' })
    readonly email: string;

    @IsBoolean()
    @IsOptional()
    @Field({ description: 'canEdit for the membership.' })
    readonly canEdit?: boolean;

    @IsBoolean()
    @IsOptional()
    @Field({ description: 'canDeploy for the membership.' })
    readonly canDeploy?: boolean;

    @IsBoolean()
    @IsOptional()
    @Field({ description: 'canManage for the membership.' })
    readonly canManage?: boolean;
}

@InputType()
export class UpdateOrganizationInput extends OmitType(PartialType(CreateOrganizationInput), ['owner'], InputType) {
    @IsString()
    @Field({ description: 'The id of the organization.' })
    readonly id: string;
}

@InputType()
export class OrganizationInput extends PickType(Organization, ['id'], InputType) {}

@InputType()
export class TransferOrganizationInput extends PickType(Organization, ['id'], InputType) {
    @IsString()
    @Field({ description: 'The new ownerId of the organization.' })
    readonly ownerId: string;
}

@ObjectType('BasicAggregator')
export class BasicAggregator {
    @IsNumber()
    @Field({ description: 'Daily values in the aggregator' })
    readonly daily: number;

    @IsNumber()
    @Field({ description: 'Weekly values in the aggregator' })
    readonly weekly: number;

    @IsNumber()
    @Field({ description: 'Monthly values in the aggregator' })
    readonly monthly: number;
}

@ObjectType('AggregatorForCollection')
export class AggregatedCollection extends BasicAggregator {
    @IsNumber()
    @Field({ description: 'Last 30 days in the aggregator' })
    readonly last30Days: number;

    @IsNumber()
    @Field({ description: 'Last 7 days in the aggregator' })
    readonly last7Days: number;
}

@ObjectType('AggregatedBuyer')
export class AggregatedBuyer extends BasicAggregator {}

@ObjectType('AggregatedEarning')
export class AggregatedEarning extends BasicAggregator {}

@ObjectType('OrganizationProfit')
export class OrganizationProfit extends Profit {
    @IsString()
    @Field({ description: 'payment token for profit' })
    readonly paymentToken: string;
}

@ObjectType('OrganizationLatestSaleData')
export class OrganizationLatestSaleData extends LatestSaleData {}

@ObjectType('OrganizationLatestSalePaginated')
export class OrganizationLatestSalePaginated extends Paginated(OrganizationLatestSaleData) {}

@ObjectType('CollectionStatFromOrganization')
export class CollectionStatFromOrganization {
    @Field(() => Int, { description: 'The number of total collections for this stat' })
    @IsNumber()
    readonly total: number;

    @Field(() => Int, { description: 'The number of live collections for this stat' })
    @IsNumber()
    readonly live: number;

    @Field(() => Int, { description: 'The number of close collections for this stat' })
    @IsNumber()
    readonly closed: number;
}
