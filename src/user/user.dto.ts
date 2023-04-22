import { ArgsType, Field, Int, ObjectType, InputType, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsDateString, IsUrl, ValidateIf, IsOptional } from 'class-validator';

@ObjectType('User')
export class User {
    @ApiProperty()
    @IsString()
    @Field((returns) => ID!)
    id: string;

    @ApiProperty()
    @IsString()
    @Field()
    @IsOptional()
    username?: string;

    @ApiProperty()
    @IsString()
    @Field()
    @IsOptional()
    name?: string;

    @Field()
    @IsString()
    email: string;

    @Field()
    @IsString()
    password?: string;

    @Field()
    @ApiProperty()
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
