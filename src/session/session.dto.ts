import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { Field, InputType, ObjectType } from '@nestjs/graphql';

import { User } from '../user/user.dto';
import { Wallet } from '../wallet/wallet.dto';

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
    readonly address: string;

    @IsString()
    @Field({ description: 'The message to sign.' })
    readonly message: string;

    @IsString()
    @Field({ description: 'The signature of the message.' })
    readonly signature: string;

    @IsBoolean()
    @IsOptional()
    @Field({ defaultValue: false, description: "Whether we need to create a new user if the wallet have't been bound to a user." })
    readonly createUser: boolean;
}

@InputType()
export class CreateSessionFromEmailInput {
    @IsString()
    @Field({ description: 'The user email.' })
    readonly email: string;

    @IsString()
    @Field({ description: 'The hashed password for the user.' })
    readonly password: string;
}

@InputType()
export class CreateSessionFromGoogleInput {
    @IsString()
    @Field({ description: 'The user email.' })
    readonly accessToken: string;
}
