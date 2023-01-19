import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VUserWalletInfo } from 'src/dto/auth.dto';
import { VFollowUserWalletReqDto, VGetAddressReqDto, VUpdateUserWalletReqDto, VUserFollowerListReqDto, VUserFollowerListRspDto, VUserFollowingListReqDto, VUserFollowingListRspDto } from 'src/dto/user.wallet.dto';
import { Public } from 'src/lib/decorators/public.decorator';
import { AuthPayload } from 'src/services/auth.service';
import { JWTService } from 'src/services/jwt.service';
import { UserWalletService } from 'src/services/user.wallet.service';

@Resolver('UserWallet')
export class UserWalletResolver {
    constructor(private readonly userWalletService: UserWalletService, private readonly jwtService: JWTService) {}

    @Public()
    @Query(() => VUserWalletInfo)
    async getAddressInfo(@Context('req') req: any, @Args() args: VGetAddressReqDto): Promise<VUserWalletInfo> {
        const payload = await this.jwtService.verifySession(req.headers.session);
        const rsp = await this.userWalletService.getAddressInfo(args.address.toLowerCase(), payload);
        return rsp;
    }

    @Mutation(() => Boolean)
    async followUserWallet(@Context('req') req: any, @Args() args: VFollowUserWalletReqDto): Promise<Boolean> {
        const payload = req.user as AuthPayload;
        var rsp = await this.userWalletService.followUserWallet(payload, args.address.toLowerCase(), args.isFollowed);
        return rsp;
    }

    @Mutation(() => Boolean)
    async updateAddressInfo(@Context('req') req: any, @Args() args: VUpdateUserWalletReqDto): Promise<Boolean> {
        const payload = req.user as AuthPayload;
        const rsp = await this.userWalletService.updateAddresInfo(payload.id, args);
        return rsp;
    }

    @Public()
    @Query(() => VUserFollowingListRspDto)
    public async getUserFollowingList(@Context('req') req: any, @Args() args: VUserFollowingListReqDto): Promise<VUserFollowingListRspDto> {
        const payload = await this.jwtService.verifySession(req.headers.session);
        const rsp = await this.userWalletService.getUserFollowingList(args, payload);
        return rsp;
    }

    @Public()
    @Query(() => VUserFollowerListRspDto)
    public async getUserFollowerList(@Context('req') req: any, @Args() args: VUserFollowerListReqDto): Promise<VUserFollowerListRspDto> {
        const payload = await this.jwtService.verifySession(req.headers.session);
        const rsp = await this.userWalletService.getUserFollowerList(args, payload);
        return rsp;
    }
}
