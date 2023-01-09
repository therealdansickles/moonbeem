import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEthereumAddress, IsOptional, IsString } from 'class-validator';

export class FollowUserWalletReqDto {
    @IsEthereumAddress()
    @ApiProperty({
        example: '0xee6bf10a93c73617432e0debec4e10920ae898a1',
    })
    readonly address: string;

    @IsBoolean()
    @ApiProperty({
        example: true,
    })
    readonly isFollowed?: boolean;
}

export class GetAddressReqDto {
    @IsEthereumAddress()
    @ApiProperty({
        example: '0x9A70b15c2936d440c82Eb988A20F11ef2cd79395',
    })
    readonly address: string;
}

export class UpdateUserWalletReqDto {
    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly name?: string;

    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly avatar?: string;

    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly customUrl?: string;

    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly description?: string;

    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly discordLink?: string;

    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly facebookLink?: string;

    @ApiProperty({})
    @IsString()
    @IsOptional()
    readonly twitterLink?: string;
}
