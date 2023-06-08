import { ObjectType, Field, ID } from '@nestjs/graphql';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsNumber } from 'class-validator';

@ObjectType('SystemConfig')
export class SystemConfig {
    @ApiProperty()
    @IsString()
    @Field(() => ID)
    readonly id: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'Config name.' })
    readonly name: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Config value.' })
    readonly value: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Type of config value. int64/string/int128' })
    readonly kind: string;

    @ApiProperty()
    @IsString()
    @Field({ description: 'Config comment.' })
    readonly comment?: string;

    @ApiProperty()
    @IsNumber()
    @Field({ description: 'The chain id for the config.' })
    readonly chainId?: number;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The created time.' })
    readonly createdAt: Date;

    @ApiProperty()
    @IsDateString()
    @Field({ description: 'The DateTime that this config was last updated.' })
    readonly updatedAt: Date;
}
