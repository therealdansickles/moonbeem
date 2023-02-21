import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { VLoginReqDto, VLoginRspDto } from '../dto/auth.dto.js';
import { Public } from '../lib/decorators/public.decorator.js';
import { AuthPayload, AuthService } from '../services/auth.service.js';

@Resolver('Auth') // decorator: mean this is graphql resolver
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Mutation(() => VLoginRspDto) // type: Query/Mutation, String: return type
    async loginWithWallet(parent, @Args() args: VLoginReqDto, context, info): Promise<VLoginRspDto> {
        var rsp = await this.authService.loginWithWallet(args.address.toLowerCase(), args.message, args.signature);
        return rsp;
    }

    @Mutation(() => Boolean)
    async logoutWallet(@Context('req') request: any): Promise<Boolean> {
        const addr = (request.user as AuthPayload).address;
        var rsp = await this.authService.logoutWithWallet(addr);
        return rsp;
    }
}
