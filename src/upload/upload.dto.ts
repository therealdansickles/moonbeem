import { IsObject, IsString } from 'class-validator';

export class VUploadImageRsp {
    @IsString()
    readonly url: string;
}

export class VUploadImageReqDto {
    @IsString()
    readonly contentType: string;

    @IsObject()
    readonly buffer: Buffer;
}
