export interface IAttribute {
    traitType: string;
    value: any;
    displayType?: string;
}

export type ITier = {
    attributes?: IAttribute[];
    avatar?: string;
    background?: string;
    description?: string;
    endId: number;
    external_url?: string;
    frozen?: boolean;
    maxMint: number;
    name: string;
    paymentToken: string;
    price: string;
    startId: number;
    tierId: number;
    vibeProperties?: IVibeProperty[];
};

export type IVibeProperty = {
    displayType?: string;
    extension?: string;
    traitType: string;
    value: any;
};

export interface IPreMint {
    owner: string;
    contract: string;
    name: string;
    symbol: string;
    begin_time: number;
    end_time: number;
    tier: number;
    price: string;
    start_id: number;
    current_id: number;
    end_id: number;
    payment_token: string;
}

export interface IAttributeOverview {
    collection: string;
    attribute: any;
}
