import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsOptional, IsString } from 'class-validator';

@ObjectType()
export class Search {}

@InputType('SearchInput')
export class SearchInput {
    @Field()
    @IsString()
    keyword: string;

    @Field((type) => Int, { nullable: true, defaultValue: 0 })
    @IsNumber()
    @IsOptional()
    offset?: number;

    @Field(() => Int, { nullable: true, defaultValue: 10 })
    @IsNumber()
    @IsOptional()
    limit?: number;
}
