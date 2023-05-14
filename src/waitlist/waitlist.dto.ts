import { ArgsType, Field, Int, ObjectType, InputType, ID, PickType, PartialType } from '@nestjs/graphql';
import { IsNumber, IsString, IsDateString, IsUrl, ValidateIf, IsOptional, IsEthereumAddress, IsBoolean } from 'class-validator';

@ObjectType('Waitlist')
export class Waitlist {
    @IsString()
    @Field((returns) => ID!)
    id: string;

    @Field()
    @IsString()
    email: string;

    @IsEthereumAddress()
    @Field({ description: 'The address for a wallet.' })
    address: string;

    @Field()
    @IsNumber()
    seatNumber: number;

    @Field({ nullable: true, description: 'The twitter username' })
    @IsString()
    @IsOptional()
    twitter?: string;

    @Field({ nullable: true, description: 'Whether they have claimed the NFT' })
    @IsBoolean()
    @IsOptional()
    isClaimed?: boolean;

    @Field({ nullable: true, description: 'The kind of the waitlist.'})
    @IsString()
    @IsOptional()
    kind?: string;
}

@InputType()
export class GetWaitlistInput extends PickType(PartialType(Waitlist, InputType), ['email', 'address']) {}

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
