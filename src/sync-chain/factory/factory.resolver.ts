import { Args, Resolver, Query, Int } from '@nestjs/graphql';
import { Factory, GetFactoriesInput } from './factory.dto';
import { Public } from '../../session/session.decorator';
import { FactoryService } from './factory.service';

@Resolver('Factory')
export class FactoryResolver {
    constructor(private readonly factoryService: FactoryService) {}

    @Public()
    @Query(() => Factory, { description: 'returns a factory contract for a given uuid' })
    async factory(@Args('id') id: string): Promise<Factory> {
        return await this.factoryService.getFactory(id);
    }

    @Public()
    @Query(() => [Factory], { description: 'returns a factory list for a given chain id' })
    async factories(@Args('chainId', { type: () => Int! }) chainId: number): Promise<Factory[]> {
        return await this.factoryService.getFactories(chainId);
    }
}
