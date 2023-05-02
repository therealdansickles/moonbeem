import { Field, ObjectType, InputType, ID, PickType, OmitType, PartialType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { Wallet } from '../wallet/wallet.dto';

@ObjectType('User')
export class User {
    @ApiProperty()
    @IsString()
    @Field((returns) => ID!)
    id: string;

    @ApiProperty()
    @Field({ description: 'The username of the user.', nullable: true })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty()
    @Field({ description: 'The name of the user.', nullable: true })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty()
    @Field({ description: 'The email of the user.' })
    @IsString()
    email: string;

    @ApiProperty()
    @Field({ description: 'The password of the user.', nullable: true })
    @IsString()
    @IsOptional()
    password?: string;

    @ApiProperty()
    @Field({ description: 'The avatarUrl of the user.', nullable: true })
    @IsString()
    @IsOptional()
    avatarUrl?: string;

    @ApiProperty()
    @Field({ description: "The URL pointing to the user's background.", nullable: true })
    @IsString()
    @IsOptional()
    backgroundUrl?: string;

    @ApiProperty()
    @Field({ description: "The url of the user's website.", nullable: true })
    @IsString()
    @IsOptional()
    websiteUrl?: string;

    @ApiProperty()
    @Field({ description: 'The twitter handle for the user.', nullable: true })
    @IsString()
    @IsOptional()
    twitter?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    @Field({ description: 'The instagram handle for the user.', nullable: true })
    instagram?: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    @Field({ description: 'The discord handle for the user.', nullable: true })
    discord?: string;

    @ApiProperty()
    @Field((returns) => [Wallet], { description: 'The wallets of the user.', nullable: true })
    wallets?: Wallet[];
}

@InputType()
export class UserInput extends PickType(User, ['id'] as const, InputType) {}

@InputType()
export class UpdateUserInput extends PartialType(OmitType(User, ['password', 'wallets'] as const), InputType) {}
