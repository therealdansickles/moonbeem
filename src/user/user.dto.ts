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
