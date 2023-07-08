import { Public } from '../session/session.decorator';
import { NftActivityService } from './nftActivity.service';
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
@ApiTags('Webhook')
@Controller('webhook')
export class NftActivityController {
    constructor(private readonly nftActivityServiceService: NftActivityService) { }
    @Public()
    @Post()
    async eventFromAlchemy(@Body() requestBody: any) {
        try {
            await this.nftActivityServiceService.createActivity(requestBody);
            return {
                message: 'success',
                data: requestBody,
            };
        } catch (error) {
            return {
                message: 'failed ' + error.message,
                data: requestBody,
            };
        }
    }
}
