import { Args, Mutation, Resolver } from '@nestjs/graphql';

import { Public } from '../session/session.decorator';
import { MaasExternalWebhookInput } from './maas.dto';
import { MaasService } from './maas.service';

@Resolver()
export class MaasResolver {
    constructor(private readonly maasService: MaasService) {}

    @Public()
    @Mutation(() => Boolean, { description: 'Receive external webhook requests.' })
    async maasExternalWebhook(@Args('input') input: MaasExternalWebhookInput) {
        await this.maasService.handleAdGated({ collectionId: input.collectionId, address: input.address.toLowerCase() });
        return true;
    }
}
