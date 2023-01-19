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
