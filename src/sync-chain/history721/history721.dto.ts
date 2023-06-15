import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber } from 'class-validator';
import { History721Type } from './history721.entity';

registerEnumType(History721Type, { name: 'History721Type' });

@ObjectType('History721')
export class History721 {
    @ApiProperty()
    @IsString()
    @Field(() => ID)
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
    @IsString()
    @Field({ description: 'Transaction time of transaction.' })
    readonly txTime: number;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The contract address.' })
    readonly address: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The token id of contract.' })
    readonly tokenId: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'The owner of token id.' })
    readonly receiver: string;

    @ApiProperty()
    @Field(() => History721Type, { description: 'Transaction type.' })
    readonly kind: History721Type;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The chain id for the transaction' })
    readonly chainId?: number;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this organization was created(initially created as a draft).' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this organization was last updated.' })
    readonly updatedAt: Date;
}
