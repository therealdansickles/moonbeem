import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserWalletInfo } from 'src/dto/auth.dto';
import { FollowUserWalletReqDto, GetAddressReqDto, UpdateUserWalletReqDto } from 'src/dto/user.wallet.dto';
import { AuthPayload } from 'src/services/auth.service';
import { JWTService } from 'src/services/jwt.service';
import { UserWalletService } from 'src/services/user.wallet.service';

@Resolver('UserWallet')
export class UserWalletResolver {
    constructor(private readonly userWalletService: UserWalletService, private readonly jwtService: JWTService) {}

    @Query(() => UserWalletInfo)
    async getAddressInfo(@Context('req') req: any, @Args() args: GetAddressReqDto): Promise<UserWalletInfo> {
        const payload = req.user as AuthPayload;
        const rsp = await this.userWalletService.getAddressInfo(args.address.toLowerCase(), payload);
        return rsp;
    }

    @Mutation(() => Boolean)
    async followUserWallet(@Context('req') req: any, @Args() args: FollowUserWalletReqDto): Promise<Boolean> {
        const payload = req.user as AuthPayload;
        var rsp = await this.userWalletService.followUserWallet(payload, args.address.toLowerCase(), args.isFollowed);
        return rsp;
    }

    @Mutation(() => Boolean)
    async updateAddressInfo(@Context('req') req: any, @Args() args: UpdateUserWalletReqDto): Promise<Boolean> {
        const payload = req.user as AuthPayload;
        const rsp = await this.userWalletService.updateAddresInfo(payload.id, args);
        return rsp;
    }
}
