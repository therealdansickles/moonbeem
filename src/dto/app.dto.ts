import { ArgsType, Field, Int, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

@ArgsType() // graphql: mark it as params class
export class VTxStatusReqDto {
    @Field() // graphql: a field of the params
    @ApiProperty({
        example: '1',
        description: 'chain id',
    }) // swagger field description
    @IsString() // field type validation
    readonly chain: string;

    @Field() // graphql: a field of the params
    @ApiProperty({
        example: '0x346e626e0e6fb0b8f74916f2c1389eeeaa0cd26ed4d7adb88b7c61740becc24c',
        description: 'transaction hash',
    }) // swagger field description
    @IsString() // field type validation
    readonly txHash: string;
}

@ArgsType()
export class FactoryConfigReqDto {
    @Field(() => Int, { nullable: true, defaultValue: 0 })
    @ApiProperty({ nullable: true, default: 0 })
    @Type(() => Number)
    @IsNumber()
    readonly chainId?: number = 0;
}

@ObjectType()
export class FactoryConfigData {
    @Field()
    @ApiProperty()
    @IsString()
    readonly name: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly value: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly type: string;

    @Field()
    @ApiProperty()
    @IsString()
    readonly comment: string;

    @Field(() => Int)
    @ApiProperty({})
    @Type(() => Number)
    @IsNumber()
    readonly chainId: number;
}

@ObjectType()
export class FactoryConfigRspDto {
    @Field(() => [FactoryConfigData])
    @ApiProperty({ type: [FactoryConfigData] })
    @Type()
    readonly data: FactoryConfigData[];

    @Field(() => Int)
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    readonly total: number;
}
