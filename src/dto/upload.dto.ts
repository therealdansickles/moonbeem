import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class VUploadImageRsp {
    @ApiProperty()
    @IsString()
        url: string;
}

export class VUploadImageReqDto {
    @ApiProperty()
    @IsString()
        contentType: string;

    @ApiProperty()
    @IsObject()
        buffer: Buffer;
}
