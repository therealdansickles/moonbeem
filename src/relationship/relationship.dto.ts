import { ID, Field, ObjectType, InputType, PickType, OmitType } from '@nestjs/graphql';
import { IsString, IsEthereumAddress, IsObject, IsOptional } from 'class-validator';
import { Wallet, WalletInput } from '../wallet/wallet.dto'

@ObjectType('Relationship')
export class Relationship {
    @IsString()
    @Field((returns) => ID!)
    readonly id: string;

    @IsObject()
    @IsOptional()
    @Field({ description: 'The following wallet.', nullable: true })
    following?: Wallet;

    @IsObject()
    @IsOptional()
    @Field({ description: 'The wallet address follow to.', nullable: true })
    follower?: Wallet;
}

@InputType()
export class CreateRelationshipByAddressInput {
    @IsEthereumAddress()
    @Field({ description: 'The following wallet address.' })
    followingAddress: string

    @IsEthereumAddress()
    @Field({ description: 'The follower wallet address.' })
    followerAddress: string
}

@InputType()
export class CreateRelationshipInput {
    @Field({ description: 'The following wallet id.' })
    following: WalletInput

    @Field({ description: 'The follower wallet id.' })
    follower: WalletInput
}