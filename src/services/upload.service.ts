import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { VUploadImageReqDto, VUploadImageRsp } from 'src/dto/upload.dto';
import { AWSAdapter, ResourceType } from '../lib/adapters/aws.adapter';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
    constructor(private readonly aws: AWSAdapter) {}

    public async handleImage(uploadImageReq: VUploadImageReqDto): Promise<VUploadImageRsp> {
        if (!uploadImageReq.buffer || !uploadImageReq.contentType) {
            throw new HttpException(
                {
                    status: HttpStatus.BAD_REQUEST,
                    error: 'missing required parameters.',
                },
                HttpStatus.BAD_REQUEST
            );
        }
        let buf = Buffer.from(uploadImageReq.buffer);
        if (uploadImageReq.buffer.buffer) buf = Buffer.from(uploadImageReq.buffer);
        const fileName = uuidv4();

        // upload image to uploadcare
        const url = await this.aws.s3PutData(buf, fileName, ResourceType.Media, uploadImageReq.contentType);

        return { url: url };
    }
}
