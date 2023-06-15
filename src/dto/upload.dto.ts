import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class VUploadImageRsp {
    @ApiProperty()
    @IsString()
    readonly url: string;
}

export class VUploadImageReqDto {
    @ApiProperty()
    @IsString()
    readonly contentType: string;

    @ApiProperty()
    @IsObject()
    readonly buffer: Buffer;
}
