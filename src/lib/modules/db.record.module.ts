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
}

export interface AddressReleased {
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
    price: string;
    start_id: number;
    end_id: number;
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
    collection: string;
    avatar?: string;
    tiers: any[];
}

export interface SearchAccountItem {
    name: string;
    address: string;
    avatar?: string;
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
