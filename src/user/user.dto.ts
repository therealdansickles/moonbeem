import { Field, ObjectType, InputType, ID, PickType, OmitType, PartialType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { Wallet } from '../wallet/wallet.dto';

@ObjectType('User')
export class User {
    @IsString()
    @Field((returns) => ID!)
    id: string;

    @Field({ description: 'The username of the user.', nullable: true })
    @IsString()
    @IsOptional()
    username?: string;

    @Field({ description: 'The name of the user.', nullable: true })
    @IsString()
    @IsOptional()
    name?: string;

    @Field({ description: 'The email of the user.' })
    @IsString()
    email: string;

    @Field({ description: 'The password of the user.', nullable: true })
    @IsString()
    @IsOptional()
    password?: string;

    @Field({ description: 'The avatarUrl of the user.', nullable: true })
    @IsString()
    @IsOptional()
    avatarUrl?: string;

    @Field({ description: "The URL pointing to the user's background.", nullable: true })
    @IsString()
    @IsOptional()
    backgroundUrl?: string;

    @Field({ description: 'The description for the user.', nullable: true })
    @IsString()
    @IsOptional()
    about?: string;

    @Field({ description: "The url of the user's website.", nullable: true })
    @IsString()
    @IsOptional()
    websiteUrl?: string;

    @Field({ description: 'The twitter handle for the user.', nullable: true })
    @IsString()
    @IsOptional()
    twitter?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The instagram handle for the user.', nullable: true })
    instagram?: string;

    @IsString()
    @IsOptional()
    @Field({ description: 'The discord handle for the user.', nullable: true })
    discord?: string;

    @Field((returns) => [Wallet], { description: 'The wallets of the user.', nullable: true })
    wallets?: Wallet[];
}

@InputType()
export class CreateUserInput extends OmitType(User, ['id', 'wallets'] as const, InputType) {}

@InputType()
export class UserInput extends PickType(User, ['id'] as const, InputType) {}

@InputType()
export class UpdateUserInput extends PartialType(OmitType(User, ['password', 'wallets'] as const), InputType) {}

@ObjectType()
export class UserOutput extends OmitType(
    User,
    ['password', 'websiteUrl', 'twitter', 'instagram', 'discord', 'wallets'],
    ObjectType
) {}

@ObjectType()
export class SearchUser {
    @Field(() => Int)
    @IsNumber()
    total: number;

    @Field(() => [UserOutput])
    @IsArray()
    users: UserOutput[];
}
