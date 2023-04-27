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
    @Field({ description: 'The username of the user.', nullable: true })
    @IsString()
    @IsOptional()
    username?: string;

    @ApiProperty()
    @Field({ description: 'The name of the user.', nullable: true })
    @IsString()
    @IsOptional()
    name?: string;

    @Field({ description: 'The email of the user.' })
    @IsString()
    email: string;

    @Field({ description: 'The password of the user.', nullable: true })
    @IsString()
    password?: string;

    @ApiProperty()
    @Field({ description: 'The avatarUrl of the user.', nullable: true })
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
    @Field({ description: 'The unique uuid of the user.' })
    readonly id: string;

    @ApiProperty()
    @Field({ description: 'The username of the user.', nullable: true })
    @IsString()
    @IsOptional()
    readonly username?: string;

    @ApiProperty()
    @Field({ description: 'The name of the user.', nullable: true })
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiProperty()
    @Field({ description: 'The email of the user.', nullable: true })
    @IsString()
    @IsOptional()
    readonly email?: string;

    @ApiProperty()
    @Field({ description: 'The avatarUrl of the user.', nullable: true })
    @IsString()
    @IsOptional()
    readonly avatarUrl?: string;
}
