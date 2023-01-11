import { ArgsType, Field, ID, ObjectType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

@ArgsType() // graphql: mark it as params class
export class TxStatusReqDto {
    @Field() // graphql: a field of the params
    @IsString() // field type validation
    @ApiProperty({
        example: '1',
        description: 'chain id',
    }) // swagger field description
    readonly chain: string;

    @Field() // graphql: a field of the params
    @IsString() // field type validation
    @ApiProperty({
        example: '0x346e626e0e6fb0b8f74916f2c1389eeeaa0cd26ed4d7adb88b7c61740becc24c',
        description: 'transaction hash',
    }) // swagger field description
    readonly txHash: string;
}
