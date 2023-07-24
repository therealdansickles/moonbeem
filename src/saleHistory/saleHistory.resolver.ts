import { Resolver, Query, Args } from '@nestjs/graphql';
import { Public } from '../session/session.decorator';
import { EarningChart, SaleHistory } from './saleHistory.dto';
import { SaleHistoryService } from './saleHistory.service';

@Resolver()
export class SaleHistoryResolver {
    constructor(private readonly saleHistory: SaleHistoryService) {}

    @Public()
    @Query(() => SaleHistory, { description: 'return sale', nullable: true })
    async getSaleHistory(@Args('address') address: string, @Args('cursor') cursor: string): Promise<SaleHistory> {
        return await this.saleHistory.getSaleHistory(address, cursor);
    }
    @Public()
    @Query(() => EarningChart)
    async getEarningChart(@Args('slug') slug: string): Promise<EarningChart> {
        return await this.saleHistory.getEarningChart(slug);
    }
}
