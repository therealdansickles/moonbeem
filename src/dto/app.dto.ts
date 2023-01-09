import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TxStatusReqDto {
    // field type validation
    @IsString()
    // swagger field description
    @ApiProperty({
        example: '1',
        description: 'chain id',
    })
    readonly chain: string;

    // field type validation
    @IsString()
    // swagger field description
    @ApiProperty({
        example: '0x346e626e0e6fb0b8f74916f2c1389eeeaa0cd26ed4d7adb88b7c61740becc24c',
        description: 'transaction hash',
    })
    readonly txHash: string;
}
