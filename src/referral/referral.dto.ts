import { IsNumber, IsOptional, IsString } from 'class-validator';

import { Field, InputType, Int, ObjectType, OmitType } from '@nestjs/graphql';


@ObjectType('Referral')
export class Referral {
    @Field(() => String)
    @IsString()
    readonly id: string;

    @Field(() => String)
    @IsString()
    readonly referralCode: string;

    @Field(() => String)
    @IsString()
    readonly collectionId: string;

    @Field(() => String, { nullable: true })
    @IsOptional()
    @IsString()
    readonly tokenId?: string;

    @Field(() => Int, { defaultValue: 1 })
    @IsOptional()
    @IsNumber()
    readonly count?: number;
}

@InputType('CreateReferralInput')
export class CreateReferralInput extends OmitType(Referral, ['id'], InputType) {
}
