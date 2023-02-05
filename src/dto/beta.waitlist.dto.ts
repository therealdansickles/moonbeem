import { ArgsType } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsNumber, IsObject, IsOptional, isString, IsString } from 'class-validator';

export class VBetaWaitlistLeaderboardItem {
    @ApiProperty()
    @IsString()
    address: string;

    @ApiProperty()
    @IsNumber()
    points: number;
}

export class VBetaWaitlistLeaderboardRsp {
    @ApiProperty({
        type: [VBetaWaitlistLeaderboardItem],
    })
    @IsArray()
    items: VBetaWaitlistLeaderboardItem[];

    @ApiProperty()
    @IsBoolean()
    isLastPage: boolean;
}

export class VBetaWaitlistScoreRsp {
    @ApiProperty()
    @IsNumber()
    points: number;

    @ApiProperty()
    @IsNumber()
    @IsOptional()
    position?: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    leaderboard?: string;
}

@ArgsType()
export class VGetAddressScoreReq {
    @ApiProperty()
    @IsString()
    address: string;
}
