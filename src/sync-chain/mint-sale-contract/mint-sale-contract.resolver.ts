import { Args, Resolver, Query } from '@nestjs/graphql';
import { Public } from '../../lib/decorators/public.decorator';
import { MintSaleContractService } from './mint-sale-contract.service';
import { MintSaleContract } from './mint-sale-contract.dto';

@Resolver('MintSaleContract')
export class MintSaleContractResolver {
    constructor(private readonly mintSaleContractService: MintSaleContractService) {}

    @Public()
    @Query(() => MintSaleContract, { description: 'returns a contract for a given uuid' })
    async mintSaleContract(@Args('id') id: string): Promise<MintSaleContract> {
        return await this.mintSaleContractService.getMintSaleContract(id);
    }
}
