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
        // the name should formatted as:
        // @vibelabs/loyalty-points
        // @vibelabs/ad-gated
        const [, name] = input.name?.split('/') || [];
        switch (name) {
            case 'ad-gated': {
                await this.maasService.handleAdGated({ collectionId: input.collectionId, address: input.address.toLowerCase() });
                break;
            }
            default: {
                console.log(`We don't have external webhook for ${input.name}`);
            }
        }
        return true;
    }
}
