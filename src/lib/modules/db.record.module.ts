export interface TotalRecord {
    total: number;
}

export interface TokenPrice {
    token: string;
    price: string;
}

export interface AddressHolding {
    collection_id: string;
    collection_address: string;
    collection_name: string;
    collection_avatar: string;
    collection_description: string;
    collection_background: string;
    collection_type: string;
    collection_tier: number;
    payment_token: string;
    token: string;
    token_id: string;
    owner: string;
    price: string;
    coin_id?: string;
    coin_chain_id?: number;
    coin_contract?: string;
    coin_name?: string;
    coin_symbol?: string;
    coin_decimals?: number;
    coin_derived_eth?: string;
    coin_derived_usdc?: string;
    coin_native?: boolean;
}

export interface UserFollowingRec {
    id: string;
    address: string;
    avatar: string;
    name: string;
}

export interface AddressActivity {
    // collection data
    id: string;
    name: string;
    description: string;
    avatar: string;
    background: string;
    address: string;
    type: string;
    chain_id: number;
    org_id: string;
    creator: string;
    payment_token: string;
    total_sypply: number;
    begin_time: number;
    end_time: number;
    tiers: string;
    token: string;
    token_id: string;
    owner: string;
    tier_id: number;
    price: string;
}

export interface AddressReleased {
    id: string;
    name: string;
    description: string;
    avatar: string;
    address: string;
    background: string;
    type: string;
    chain_id: number;
    org_id: string;
    creator: string;
    payment_token: string;
    total_sypply: number;
    begin_time: number;
    end_time: number;
    price: string;
    tier_id: number;
    tiers: string;
}

export interface CollectionActivity {
    collection_id: string;
    collection_address: string;
    collection_name: string;
    collection_avatar: string;
    collection_description: string;
    collection_background: string;
    collection_type: string;
    collection_tier: number;
    token: string;
    token_id: string;
    owner: string;
    recipient: string;
    price: string;
    tx_time: number;
}

export interface SearchCollectionItem {
    name: string;
    address: string;
    chainId: number;
    avatarUrl?: string;
    tiers?: any[];
}

export interface SearchAccountItem {
    name?: string;
    email?: string;
    address: string;
    avatarUrl?: string;
}

export interface MetadataPollerItem {
    id: string;
    collection: string;
    uniq_id: string;
    tier: number;
    start_id: number;
    end_id: number;
    current_id: number;
}

export interface LandingPageCollectionItem {
    user_address: string;
    user_name: string;
    user_description: string;
    user_avatar: string;
    user_discord: string;
    user_facebook: string;
    user_twitter: string;
    user_customurl: string;
    id: string;
    name: string;
    description: string;
    avatar: string;
    background: string;
    address: string;
    type: string;
    chain_id: number;
    org_id: string;
    creator: string;
    payment_token: string;
    total_sypply: number;
    begin_time: number;
    end_time: number;
    royalty_address: string;
    royalty_rate: number;
    floor_price: string;
    tiers: string;
}

export interface LandingPageRankingOfCreatorItem {
    user_address: string;
    user_name: string;
    user_description: string;
    user_avatar: string;
    user_discord: string;
    user_facebook: string;
    user_twitter: string;
    user_customurl: string;
    total_price: string;
    payment_token: string;
    chain_id: number;
}

export interface LandingPageRankingOfItemItem {
    tier_id: number;
    tier_startid: number;
    tier_endid: number;
    tier_currentid: number;
    tier_price: string;
    id: string;
    name: string;
    description: string;
    avatar: string;
    background: string;
    address: string;
    type: string;
    chain_id: number;
    org_id: string;
    creator: string;
    payment_token: string;
    total_sypply: number;
    begin_time: number;
    end_time: number;
    tiers: string;
}

export interface SysConfigItem {
    cfg_name: string;
    cfg_value: string;
    cfg_type: string;
    cfg_comment: string;
    chain_id: number;
}
