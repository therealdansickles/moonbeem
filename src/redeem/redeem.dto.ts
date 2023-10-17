import { IsBoolean, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

import { Field, ID, InputType, Int, ObjectType, OmitType } from '@nestjs/graphql';

import { Collection, CollectionInput } from '../collection/collection.dto';

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

    @IsInt()
    @Field(() => Int)
    readonly tokenId: number;

    @IsString()
    @Field(() => String)
    readonly email: string;

    @IsObject()
    @Field(() => Collection, { description: 'The collection associated with this redeem.' })
    readonly collection: Collection;

    @IsBoolean()
    @Field(() => Boolean)
    readonly isRedeemed: boolean;
}

@InputType()
export class CreateRedeemInput extends OmitType(Redeem, ['id', 'collection', 'isRedeemed'], InputType) {
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
