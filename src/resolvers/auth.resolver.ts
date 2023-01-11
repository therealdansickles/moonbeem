import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { LoginReqDto, LoginRspDto } from 'src/dto/auth.dto';
import { Public } from 'src/lib/decorators/public.decorator';
import { AuthPayload, AuthService } from 'src/services/auth.service';

@Resolver('Auth') // decorator: mean this is graphql resolver
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Mutation(() => LoginRspDto) // type: Query/Mutation, String: return type
    async loginWithWallet(parent, @Args() args: LoginReqDto, context, info): Promise<LoginRspDto> {
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
