import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress } from 'class-validator';

export class AddressHoldingReqDto {
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    @IsEthereumAddress()
    readonly address: string;
}
