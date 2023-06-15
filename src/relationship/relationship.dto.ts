import { ID, Field, ObjectType, InputType } from '@nestjs/graphql';
import { IsString, IsEthereumAddress, IsObject, IsOptional } from 'class-validator';
import { Wallet, WalletInput } from '../wallet/wallet.dto';

@ObjectType('Relationship')
export class Relationship {
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @IsObject()
    @IsOptional()
    @Field({ description: 'The following wallet.', nullable: true })
    readonly following?: Wallet;

    @IsObject()
    @IsOptional()
    @Field({ description: 'The wallet address follow to.', nullable: true })
    readonly follower?: Wallet;
}

@InputType()
export class CreateRelationshipByAddressInput {
    @IsEthereumAddress()
    @Field({ description: 'The following wallet address.' })
    readonly followingAddress: string;

    @IsEthereumAddress()
    @Field({ description: 'The follower wallet address.' })
    readonly followerAddress: string;
}

@InputType()
export class DeleteRelationshipByAddressInput extends CreateRelationshipByAddressInput {}

@InputType()
export class CreateRelationshipInput {
    @Field({ description: 'The following wallet id.' })
    readonly following: WalletInput;

    @Field({ description: 'The follower wallet id.' })
    readonly follower: WalletInput;
}

@InputType()
export class DeleteRelationshipInput extends CreateRelationshipInput {}
