import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { LoginWithWalletResponse, LoginWithWalletInput, LoginWithEmailResponse, CreateUserWithEmailInput, LogoutInput, LoginWithEmailInput } from './auth.dto';
import { Public } from '../lib/decorators/public.decorator';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { JWTService } from '../services/jwt.service';
import { BadRequestException } from '@nestjs/common';

@Resolver('Auth') // decorator: mean this is graphql resolver
export class AuthResolver {
    constructor(private readonly authService: AuthService, private readonly jwtService: JWTService) {}

    @Public()
    @Mutation(() => LoginWithWalletResponse) // type: Query/Mutation, String: return type
    async loginWithWallet(@Args('input') input: LoginWithWalletInput): Promise<LoginWithWalletResponse> {
        const rsp = await this.authService.loginWithWallet(input.address.toLowerCase(), input.message, input.signature);
        return rsp;
    }

    @Public()
    @Mutation(() => LoginWithEmailResponse) // type: Query/Mutation, String: return type
    async loginWithEmail(@Args('input') input: LoginWithEmailInput): Promise<LoginWithEmailResponse> {
        const rsp = await this.authService.loginWithEmail(input);
        return rsp;
    }

    @Public()
    @Mutation(() => Boolean)
    async logout(@Context('req') req: Request, @Args('input') input: LogoutInput): Promise<boolean> {
        const payload = await this.jwtService.verifySession(req.headers.session);

        const identifier = input.address ?? input.email;
        if (identifier !== payload.address && identifier !== payload.email) {
            throw new BadRequestException();
        }

        const rsp = await this.authService.logout(identifier);
        return rsp;
    }

    @Public()
    @Mutation(() => LoginWithEmailResponse)
    async createUserWithEmail(@Args('input') input: CreateUserWithEmailInput): Promise<LoginWithEmailResponse> {
        const rsp = await this.authService.createUserWithEmail(input);
        return rsp;
    }
}
