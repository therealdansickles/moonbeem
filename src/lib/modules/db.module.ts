export const TbPreMintRecord = 'pre_mint_record';
export const TbPreMint = 'pre_mint';
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

export const TbWaitlistScores = 'BetaScore';
export interface WaitlistScore {
    id: string;
    points: number;
    address: string;
}

export interface WaitlistCount {
    count: number;
}
