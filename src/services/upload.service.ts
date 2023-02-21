import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { UploadClient } from '@uploadcare/upload-client';
import { VUploadImageReqDto, VUploadImageRsp } from '../dto/upload.dto.js';

@Injectable()
export class UploadService {
    constructor(@Inject('UPLOADCARE') private readonly uploadcareClient: UploadClient) {}
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

        // upload image to uploadcare
        const { cdnUrl } = await this.uploadcareClient.uploadFile(Buffer.from(uploadImageReq.buffer), {
            contentType: uploadImageReq.contentType,
        });

        return { url: cdnUrl };
    }
}
