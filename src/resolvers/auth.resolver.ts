import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { VLoginRspDto, VLoginReqDto } from '../dto/auth.dto';
import { Public } from '../lib/decorators/public.decorator';
import { AuthService, AuthPayload } from '../services/auth.service';

@Resolver('Auth') // decorator: mean this is graphql resolver
export class AuthResolver {
    constructor(private readonly authService: AuthService) {}

    @Public()
    @Mutation(() => VLoginRspDto) // type: Query/Mutation, String: return type
    async loginWithWallet(@Args() args: VLoginReqDto): Promise<VLoginRspDto> {
        const rsp = await this.authService.loginWithWallet(args.address.toLowerCase(), args.message, args.signature);
        return rsp;
    }

    @Mutation(() => Boolean)
    async logoutWallet(@Context('req') request: any): Promise<boolean> {
        const addr = (request.user as AuthPayload).address;
        const rsp = await this.authService.logoutWithWallet(addr);
        return rsp;
    }
}
