import { Request } from 'express';

import { Body, Controller, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse, ApiTags } from '@nestjs/swagger';

import { IResponse, ResponseInternalError, ResponseSucc } from '../lib/interfaces/response.interface';
import { Public } from '../session/session.decorator';
import { VUploadImageReqDto, VUploadImageRsp } from './upload.dto';
import { UploadService } from './upload.service';

@ApiTags('Upload')
@Controller({
    path: 'upload',
    version: '1',
})
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

    // both endpoints basically do the same thing
    // TODO: remove this method after updating the frontend
    @Public()
    @ApiResponse({
        status: 200,
        description: 'upload an image file to cdn',
        type: VUploadImageRsp,
    })
    @Post('/asset')
    public async uploadImage(@Req() req: Request, @Body() body: VUploadImageReqDto): Promise<IResponse> {
        try {
            const rsp = await this.uploadService.handleImage(body);
            return new ResponseSucc(rsp);
        } catch (error) {
            return new ResponseInternalError((error as Error).message);
        }
    }

    @Public()
    @ApiResponse({
        status: 200,
        description: 'upload an image file to S3',
    })
    @Post('/asset/image')
    @UseInterceptors(FileInterceptor('file'))
    public async uploadImageFile(@UploadedFile() file: Express.Multer.File) {
        try {
            const rsp = await this.uploadService.handleImage({ contentType: file.mimetype, buffer: file.buffer });
            return new ResponseSucc(rsp);
        } catch (error) {
            return new ResponseInternalError((error as Error).message);
        }
    }
}
