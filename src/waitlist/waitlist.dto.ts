import { Field, ObjectType, InputType, ID, PickType, PartialType } from '@nestjs/graphql';
import { IsNumber, IsString, IsOptional, IsEthereumAddress, IsBoolean } from 'class-validator';

@ObjectType('Waitlist')
export class Waitlist {
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @Field()
    @IsString()
    readonly email: string;

    @IsEthereumAddress()
    @Field({ description: 'The address for a wallet.' })
    readonly address: string;

    @Field()
    @IsNumber()
    readonly seatNumber: number;

    @Field({ nullable: true, description: 'The twitter username' })
    @IsString()
    @IsOptional()
    readonly twitter?: string;

    @Field({ nullable: true, description: 'Whether they have claimed the NFT' })
    @IsBoolean()
    @IsOptional()
    readonly isClaimed?: boolean;

    @Field({ nullable: true, description: 'The kind of the waitlist.' })
    @IsString()
    @IsOptional()
    readonly kind?: string;
}

@InputType()
export class GetWaitlistInput extends PickType(PartialType(Waitlist, InputType), ['email', 'address', 'kind']) {}

@InputType('CreateWaitlistInput')
export class CreateWaitlistInput extends PickType(Waitlist, ['email', 'address', 'kind'], InputType) {
    @Field({ description: 'The signing message' })
    @IsString()
    readonly message: string;

    @Field({ description: 'The signature from the front-end to verify' })
    @IsString()
    readonly signature: string;

    @IsString()
    @Field({ description: 'The email of the user', nullable: true })
    @IsOptional()
    readonly twitter?: string;
}

@InputType()
export class ClaimWaitlistInput extends PickType(CreateWaitlistInput, ['address', 'message', 'signature'], InputType) {}

@InputType()
export class ClaimProfileInput extends PickType(
    CreateWaitlistInput,
    ['address', 'message', 'signature', 'kind', 'email'],
    InputType
) {}

@ObjectType()
export class ClaimProfileResult {
    @Field(() => Boolean, { description: 'Whether the success claim' })
    readonly success: boolean;

    @Field({ description: 'Returned tokenId' })
    @IsNumber()
    readonly tokenId: string;
}
