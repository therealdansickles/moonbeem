import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from '../../session/session.decorator';
import { LeaderboardRanking, MintSaleTransaction } from './mint-sale-transaction.dto';
import { MintSaleTransactionService } from './mint-sale-transaction.service';

@Resolver('MintSaleTransaction')
export class MintSaleTransactionResolver {
    constructor(private readonly transactionService: MintSaleTransactionService) {}

    @Public()
    @Query(() => MintSaleTransaction, { nullable: true, description: 'returns transaction for a given uuid' })
    async transaction(
        @Args({ name: 'id', nullable: true }) id: string,
            @Args({ name: 'address', nullable: true }) address: string,
            @Args({ name: 'recipient', nullable: true }) recipient: string
    ): Promise<MintSaleTransaction> {
        return await this.transactionService.getMintSaleTransaction({ id, address, recipient });
    }

    @Public()
    @Query(() => [LeaderboardRanking], { description: 'Get leaderboard for collection' })
    async leaderboard(@Args('address') address: string): Promise<LeaderboardRanking[]> {
        return await this.transactionService.getLeaderboard(address);
    }
}
