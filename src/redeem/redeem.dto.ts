import { IsArray, IsBoolean, IsObject, IsOptional, IsString } from 'class-validator';

import { Field, ID, InputType, ObjectType, OmitType } from '@nestjs/graphql';

import { Collection, CollectionInput } from '../collection/collection.dto';
import { CollectionPlugin } from '../collectionPlugin/collectionPlugin.dto';

@ObjectType()
export class CollectionPluginInsider extends OmitType(CollectionPlugin, ['plugin']) {}

@ObjectType()
export class Redeem {
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true, description: 'Delivery address.' })
    readonly deliveryAddress?: string;

    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true, description: 'Delivery city.' })
    readonly deliveryCity?: string;

    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true, description: 'Delivery zipcode.' })
    readonly deliveryZipcode?: string;

    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true, description: 'Delivery state.' })
    readonly deliveryState?: string;

    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true, description: 'Delivery country.' })
    readonly deliveryCountry?: string;

    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true, description: 'Delivery phone.' })
    readonly deliveryPhone?: string;

    @IsString()
    @IsOptional()
    @Field(() => String, { nullable: true, description: 'The full name of the redemption client.' })
    readonly name?: string;

    @IsString()
    @Field(() => String)
    readonly tokenId: string;

    @IsString()
    @Field(() => String)
    readonly email: string;

    @IsObject()
    @Field(() => Collection, { description: 'The collection associated with this redeem.' })
    readonly collection: Collection;

    @IsObject()
    @IsOptional()
    @Field(() => CollectionPlugin, { nullable: true, description: 'The collection plugin info associated with this redeem.' })
    readonly collectionPlugin: CollectionPluginInsider;

    @IsBoolean()
    @Field(() => Boolean)
    readonly isRedeemed: boolean;
}

@ObjectType()
export class RedeemOverview {
    @IsString()
    @Field(() => ID)
    readonly collectionPluginId: string;

    @IsString()
    @IsOptional()
    @Field(() => Number, { nullable: true, description: 'Total number of recipients.' })
    readonly recipientsTotal?: number;

    @IsArray()
    @IsOptional()
    @Field(() => [String], { nullable: true, description: 'The tokenId whom already been minted.' })
    readonly tokenIds?: string[];
}

@ObjectType()
export class RedeemQualification {
    @IsString()
    @Field(() => String)
    readonly tokenId: string;

    @IsObject()
    @Field(() => CollectionPlugin)
    readonly collectionPlugin: CollectionPlugin;

    @IsObject()
    @Field(() => Collection)
    readonly collection: Collection;
}

@InputType()
export class CreateRedeemInput extends OmitType(Redeem, ['id', 'collection', 'collectionPlugin', 'isRedeemed'], InputType) {
    @IsObject()
    @Field(() => CollectionInput, { description: 'The collection associated with this redeem.' })
    readonly collection: CollectionInput;

    @IsString()
    @Field(() => String, { description: 'The collection plugin id associated with this redeem.' })
    readonly collectionPluginId: string;

    @IsString()
    @Field(() => String)
    readonly address: string;

    @IsString()
    @Field(() => String)
    readonly message: string;

    @IsString()
    @Field(() => String)
    readonly signature: string;
}
