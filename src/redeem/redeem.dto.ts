import { Field, ID, InputType, ObjectType, OmitType, Int } from '@nestjs/graphql';
import { IsObject, IsString } from 'class-validator';
import { Collection, CollectionInput } from '../collection/collection.dto';

@ObjectType()
export class Redeem {
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @IsString()
    @Field(() => String)
    readonly deliveryAddress: string;

    @IsString()
    @Field(() => Int)
    readonly tokenId: number;

    @IsString()
    @Field(() => String)
    readonly email: string;

    @IsObject()
    @Field(() => Collection, { description: 'The collection associated with this redeem.' })
    readonly collection: Collection;
}

@InputType()
export class CreateRedeemInput extends OmitType(Redeem, ['id', 'collection'], InputType) {
    @IsObject()
    @Field(() => CollectionInput, { description: 'The collection associated with this redeem.' })
    readonly collection: CollectionInput;
}