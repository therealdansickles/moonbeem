import { Field, ObjectType, InputType, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

@ObjectType('User')
export class User {
    @ApiProperty()
    @IsString()
    @Field((returns) => ID!)
    id: string;

    @ApiProperty()
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty()
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    name?: string;

    @Field()
    @IsString()
    email: string;

    @Field({ nullable: true })
    @IsString()
    password?: string;

    @ApiProperty()
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    avatarUrl?: string;
}

@InputType('UserInput')
export class UserInput {
    @ApiProperty()
    @IsString()
    @Field((returns) => ID!)
    id: string;
}

@InputType('UpdateUserInput')
export class UpdateUserInput {
    @ApiProperty()
    @IsString()
    @Field()
    readonly id: string;

    @ApiProperty()
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    readonly username?: string;

    @ApiProperty()
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiProperty()
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    readonly email?: string;

    @ApiProperty()
    @Field({ nullable: true })
    @IsString()
    @IsOptional()
    readonly avatarUrl?: string;
}
