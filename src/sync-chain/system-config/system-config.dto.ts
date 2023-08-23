import { ObjectType, Field, ID } from '@nestjs/graphql';
import { IsString, IsDateString, IsNumber } from 'class-validator';

@ObjectType('SystemConfig')
export class SystemConfig {
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @IsNumber()
    @Field({ description: 'Config name.' })
    readonly name: string;

    @IsString()
    @Field({ description: 'Config value.' })
    readonly value: string;

    @IsString()
    @Field({ description: 'Type of config value. int64/string/int128' })
    readonly kind: string;

    @IsString()
    @Field({ description: 'Config comment.' })
    readonly comment?: string;

    @IsNumber()
    @Field({ description: 'The chain id for the config.' })
    readonly chainId?: number;

    @IsDateString()
    @Field({ description: 'The created time.' })
    readonly createdAt: Date;

    @IsDateString()
    @Field({ description: 'The DateTime that this config was last updated.' })
    readonly updatedAt: Date;
}
