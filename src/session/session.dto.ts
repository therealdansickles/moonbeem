import { ArgsType, Field, Int, ObjectType, InputType, ID, PickType } from '@nestjs/graphql';
import {
    IsNumber,
    IsString,
    IsDateString,
    IsEthereumAddress,
    IsUrl,
    ValidateIf,
    IsObject,
    IsOptional,
} from 'class-validator';

import { Wallet } from '../wallet/wallet.dto';
import { User } from '../user/user.dto';

export class Token {
    readonly walletId?: any;
}

@ObjectType()
export class Session {
    @IsString()
    @Field(() => String, { description: 'The JWT session token.' })
    readonly token: string;

    @Field(() => Wallet, { description: 'The wallet for the session.' })
    readonly wallet?: Wallet;

    @Field(() => User, { description: 'The user for the session.' })
    readonly user?: User;
}

@InputType()
export class CreateSessionInput {
    @IsString()
    @Field({ description: 'The wallet address.' })
    address: string;

    @IsString()
    @Field({ description: 'The message to sign.' })
    message: string;

    @IsString()
    @Field({ description: 'The signature of the message.' })
    signature: string;
}

@InputType()
export class CreateSessionFromEmailInput {
    @IsString()
    @Field({ description: 'The user email.' })
    email: string;

    @IsString()
    @Field({ description: 'The hashed password for the user.' })
    password: string;
}
