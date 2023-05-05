import { ObjectType, Field, ID, InputType, registerEnumType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber, IsBoolean, IsNumberString, IsObject, IsArray } from 'class-validator';
import { OrganizationInput } from '../../organization/organization.dto';
import { ContractType } from '../factory/factory.entity';

registerEnumType(ContractType, { name: 'ContractType' });

@ObjectType('MintSaleContract')
export class MintSaleContract {
    @ApiProperty()
    @IsString()
    @Field((returns) => ID!)
    readonly id: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'Block height of transaction.' })
    readonly height: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Transaction hash of transaction.' })
    readonly txHash: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'Transaction time of transaction.' })
    readonly txTime: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Transaction sender of transaction.' })
    readonly sender: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The contract address.' })
    readonly address: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The royalty contract of MintSale' })
    readonly royaltyReceiver: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The royalty rate of MintSale' })
    readonly royaltyRate: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The derivative royalty rate of MintSale' })
    readonly derivativeRoyaltyRate: number;

    @ApiProperty()
    @IsBoolean()
    @Field({ description: 'Means whether this nft supports derivative royalty' })
    readonly isDerivativeAllowed: boolean;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The begin time of the MintSale' })
    readonly beginTime: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The end time of the MintSale' })
    readonly endTime: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The tier id of the MintSale' })
    readonly tierId: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The price of the tier' })
    readonly price: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The payment token of the collection' })
    readonly paymentToken: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The start id of the tier' })
    readonly startId: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The end id of the tier' })
    readonly endId: number;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The current id of the tier' })
    readonly currentId: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The token address(erc721 address) of the collection' })
    readonly tokenAddress: string;

    @ApiProperty()
    @Field((type) => ContractType, { description: 'The type of Contract.' })
    readonly kind?: ContractType;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The chain id for the transaction' })
    readonly chainId?: number;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime of create.' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this contract was last updated.' })
    readonly updatedAt: Date;
}

@InputType('CreateMerkleRootInput')
export class CreateMerkleRootInput {
    @ApiProperty()
    @IsArray()
    @Field((type) => [CreateMerkleRootData], { description: 'Create data for merkle.' })
    readonly data: CreateMerkleRootData[];

    @ApiProperty()
    @IsObject()
    @Field((type) => OrganizationInput, {
        nullable: true,
        description: 'MerkleRoot association to collection.',
    })
    readonly organization?: OrganizationInput;
}

@InputType('CreateMerkleRootData')
export class CreateMerkleRootData {
    @ApiProperty()
    @IsString()
    @Field({ description: 'Address added to merkleTree' })
    readonly address: string;

    @ApiProperty()
    @IsNumberString()
    @Field({ description: 'Amount available, using string, the merkleTree can be expanded to erc20 tokens' })
    readonly amount: string;
}

@ObjectType()
export class CreateMerkleRootOutput {
    @ApiProperty()
    @IsBoolean()
    @Field({ description: 'Status' })
    success: boolean;

    @ApiProperty()
    @IsString()
    @Field({ description: 'MerkleTree' })
    merkleRoot: string;
}

@ObjectType()
export class GetMerkleProofOutput {
    @ApiProperty()
    @IsString()
    @Field({ description: 'User Address' })
    address: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Available Amount' })
    amount: string;

    @ApiProperty()
    @IsString()
    @Field((type) => [String], { description: 'Merkle Proof' })
    proof: string[];

    @ApiProperty()
    @IsBoolean()
    @Field({ description: 'Status' })
    success: boolean;
}
