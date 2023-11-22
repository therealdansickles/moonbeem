import { IsString } from 'class-validator';

import { Field, InputType, ObjectType, OmitType } from '@nestjs/graphql';


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

    @Field(() => String)
    @IsString()
    readonly tokenId: string;
}

@InputType('CreateReferralInput')
export class CreateReferralInput extends OmitType(Referral, ['id'], InputType) {
}
