import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { VUploadImageReqDto, VUploadImageRsp } from './upload.dto';
import { AWSAdapter, ResourceType } from '../lib/adapters/aws.adapter';

@Injectable()
export class UploadService {
    constructor(private readonly aws: AWSAdapter) {}

    // currently this does not follow single responsibility principle
    // TODO: consider moving validation to a separate layer
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
        const buf = Buffer.from(uploadImageReq.buffer);
        const fileName = uuidv4();

        // upload image to uploadcare
        const url = await this.aws.s3PutData(buf, fileName, ResourceType.Media, uploadImageReq.contentType);

        return { url };
    }
}
