export const TbUserWallet = 'UserWallet';
export interface UserWallet {
    id: string;
    address: string;
    name: string;
    avatar: string;
    createdTime: string;
    updatedTime: string;
    user: string;
    banner: string;
    customUrl: string;
    description: string;
    discordLink: string;
    facebookLink: string;
    twitterLink: string;
    collection: string;
    walletType: string;
    visible: boolean;
}

export const TbUserWalletFollowing = 'UserWalletFollowing';
export interface UserWalletFollowing {
    id: string;
    wallet: string;
    followingWallet: string;
    isFollow: boolean;
}
