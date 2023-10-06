import { Field, InputType, Int, ObjectType, OmitType, registerEnumType } from '@nestjs/graphql';
import { IsArray, IsDateString, IsNumber, IsNumberString, IsObject, IsString } from 'class-validator';
import JSON from 'graphql-type-json';

@ObjectType()
export class MerkleDataOutput {
    @IsString()
    @Field({ description: 'Address added to merkleTree.' })
    readonly address: string;

    @IsNumberString()
    @Field({ description: 'Amount available, using string, the merkleTree can be expanded to erc20 tokens' })
    readonly amount: string;
}

export enum MerkleTreeType {
    recipients = 'recipients',
    allowlist = 'allowlist',
}

registerEnumType(MerkleTreeType, { name: 'MerkleTreeType' });

@ObjectType()
export class MerkleTree {
    @IsString()
    @Field({ description: 'The ID of the merkle tree.' })
    readonly id: string;

    @IsString()
    @Field({ description: 'The merkle root for the merkle tree.', nullable: true })
    readonly merkleRoot?: string;

    @IsObject()
    @Field(() => [JSON], { description: 'The wallet of the merkle tree.', nullable: true })
    readonly data?: object[];

    @IsDateString()
    @Field({ description: 'The created datetime of the merkle tree.' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The updated datetime of the merkle tree.' })
    readonly updatedAt: Date;
}

@InputType('CreateMerkleRootInput')
export class CreateMerkleRootInput {
    @IsArray()
    @Field(() => [MerkleDataInput], { description: 'Create data for merkle.' })
    readonly data: MerkleDataInput[];
}

@InputType('CreateMerkleRootData')
export class MerkleDataInput extends OmitType(MerkleDataOutput, [] as const, InputType) {
}

@ObjectType()
export class MerkleProofOutput {
    @IsString()
    @Field({ description: 'User Address' })
    readonly address: string;

    @IsString()
    @Field({ description: 'Available Amount' })
    readonly amount: string;

    @IsString()
    @Field(() => [String], { description: 'Merkle Proof' })
    readonly proof: string[];

    @Field(() => Int, {
        nullable: true,
        defaultValue: 0,
        description: 'Given merkleRoot and collection, return the number of available',
    })
    @IsNumber()
    readonly usable?: number;
}

@InputType('CreateGeneralMerkleRootInput')
export class CreateGeneralMerkleRootInput {
    @IsArray()
    @Field(() => [JSON], { description: 'Create data for merkle.' })
    readonly data: object[];

    @IsString()
    @Field(() => MerkleTreeType, { description: 'Type for this merkle tree.' })
    readonly type: MerkleTreeType;
}

@InputType('GetGeneralMerkleProofInput')
export class GetGeneralMerkleProofInput {
    @IsString()
    @Field(() => MerkleTreeType, { description: 'Type for this merkle tree.' })
    readonly type: MerkleTreeType;

    @IsString()
    @Field({ description: 'The merkle root for the merkle tree.', nullable: true })
    readonly merkleRoot?: string;

    @IsObject()
    @Field(() => JSON, { description: 'Leaf data for the merkle tree.' })
    readonly leafData: object;
}

@ObjectType()
export class GeneralMerkleProofOutput {
    @IsArray()
    @Field(() => [String], { description: 'Merkle proof.' })
    readonly proof: string[];

    @IsObject()
    @Field(() => JSON, { description: 'Leaf data for the merkle proof' })
    readonly leafData: object;
}
