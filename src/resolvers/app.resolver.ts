import { NotFoundException } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { VTxStatusReqDto } from '../dto/app.dto.js';
import { Public } from '../lib/decorators/public.decorator.js';
import { AppService } from '../services/app.service.js';

@Public() // decorator: this api is public, no identity verification required
@Resolver('App') // decorator: mean this is graphql resolver
export class AppResolver {
    constructor(private readonly appService: AppService) {}

    @Query(() => String) // type: Query/Mutation, String: return type
    getHealth(): string {
        return this.appService.getHealth();
    }

    @Query(() => Boolean)
    async getTxStatus(@Args() p: VTxStatusReqDto): Promise<Boolean> {
        const recipe = await this.appService.getTxStatus(p.chain, p.txHash);
        if (!recipe) {
            throw new NotFoundException();
        }
        return recipe;
    }
}
