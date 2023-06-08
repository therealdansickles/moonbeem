import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsString } from 'class-validator';

@ObjectType()
export class Search {}

@InputType('SearchInput')
export class SearchInput {
    @Field()
    @IsString()
    readonly keyword: string;

    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @IsNumber()
    @IsOptional()
    readonly offset?: number;

    @Field(() => Int, { nullable: true, defaultValue: 10 })
    @IsNumber()
    @IsOptional()
    readonly limit?: number;
}
