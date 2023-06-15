import { IsString } from 'class-validator';
import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class MoonpayUrl {
    @Field({ description: 'the moonpay url with signature' })
    @IsString()
    public url: string;
}
