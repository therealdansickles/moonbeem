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
    token: string;
    token_id: string;
    owner: string;
    price: string;
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
