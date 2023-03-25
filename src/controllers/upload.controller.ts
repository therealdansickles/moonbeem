import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { VUploadImageRsp, VUploadImageReqDto } from '../dto/upload.dto';
import { Public } from '../lib/decorators/public.decorator';
import { IResponse, ResponseSucc, ResponseInternalError } from '../lib/interfaces/response.interface';
import { UploadService } from '../services/upload.service';

@ApiTags('Upload')
@Controller({
    path: 'upload',
    version: '1',
})
export class UploadController {
    constructor(private readonly uploadService: UploadService) {}

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
}
