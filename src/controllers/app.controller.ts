import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { FactoryConfigReqDto, FactoryConfigRspDto, VTxStatusReqDto } from '../dto/app.dto';
import { Public } from '../lib/decorators/public.decorator';
import { IResponse, ResponseInternalError, ResponseSucc } from '../lib/interfaces/response.interface';
import { AppService } from '../services/app.service';

@Public() // decorator: this api is public, no identity verification required
@ApiTags('App') // swagger tag category
@Controller()
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Public() // not need session in header
    @ApiResponse({
        status: 200,
        description: 'health check',
        type: String,
    }) // swagger configure: api response description
    @Get('/health')
    getHealth(): string {
        return this.appService.getHealth();
    }

    @Public()
    @ApiResponse({
        status: 200,
        description: 'check the tx hash is successed',
        type: Boolean,
    }) // swagger configure: api response description
    @Get('/tx_status/:chain/:txHash')
    async getTxStatus(@Req() req: Request, @Param() params: VTxStatusReqDto): Promise<IResponse> {
        try {
            const rsp = await this.appService.getTxStatus(params.chain, params.txHash);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }

    @Public()
    @ApiResponse({
        status: 200,
        description: 'get factory config',
        type: FactoryConfigRspDto,
    })
    @Get('/get_factory_config')
    async getFactoryConfig(@Req() req: Request, @Query() params: FactoryConfigReqDto): Promise<IResponse> {
        try {
            const rsp = await this.appService.getFactoryConfig(params);
            return new ResponseSucc(rsp);
        } catch (err) {
            return new ResponseInternalError((err as Error).message);
        }
    }
}
