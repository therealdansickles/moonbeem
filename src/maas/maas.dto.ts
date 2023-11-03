import { IsString } from 'class-validator';

import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class MaasExternalWebhookInput {
    @IsString()
    @Field({ description: 'The plugin or rule-engine name you want to trigger.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'The collection id need to be checked', nullable: true })
    readonly collectionId?: string;

    @IsString()
    @Field({ description: 'The wallet address need to be checked.', nullable: true })
    readonly address?: string;

    @IsString()
    @Field({ description: 'The tokenId need to be checked.', nullable: true })
    readonly tokenId?: string;
}
