import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../../lib/decorators/public.decorator';
import { MintSaleTransaction } from './mint-sale-transaction.dto';
import { MintSaleTransactionService } from './mint-sale-transaction.service';

@Resolver('MintSaleTransaction')
export class MintSaleTransactionResolver {
    constructor(private readonly transactionService: MintSaleTransactionService) {}

    @Public()
    @Query(() => MintSaleTransaction, { description: 'returns transaction for a given uuid' })
    async transaction(@Args('id') id: string): Promise<MintSaleTransaction> {
        return await this.transactionService.getMintSaleTransaction(id);
    }
}
