import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from 'src/lib/decorators/public.decorator';
import { VTxStatusReqDto } from 'src/dto/app.dto';
import { IResponse, ResponseInternalError, ResponseSucc } from 'src/lib/interfaces/response.interface';
import { AppService } from '../services/app.service';
import { Request } from 'express';

@Public() // decorator: this api is public, no identity verification required
@ApiTags('App') // swagger tag category
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    // swagger configure: api response description
    @ApiResponse({
        status: 200,
        description: 'health check',
        type: String,
    })
    @Get('/health')
    getHealth(): string {
        return this.appService.getHealth();
    }

    // swagger configure: api response description
    @Public()
    @ApiResponse({
        status: 200,
        description: 'check the tx hash is successed',
        type: Boolean,
    })
    @Get('/tx_status/:chain/:txHash')
    async getTxStatus(@Req() req: Request, @Param() params: VTxStatusReqDto): Promise<IResponse> {
        try {
            const rsp = await this.appService.getTxStatus(params.chain, params.txHash);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }
}
