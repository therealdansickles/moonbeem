export interface IMetadata {
    token: string;
    token_id: string;
    name: string;
    description?: string;
    image: string;
    external_url: string;
    background_color?: string;
    animation_url?: string;
    youtube_url?: string;
    attributes: IAttribute[];
    vibe_properties?: IVibePropertie;
}

export interface IAttribute {
    display_type?: string;
    trait_type: string;
    value: string | number;
}

export interface IVibePropertie {
    nft_type: ICollectionType;
    artists?: string[];
    attributes: IVivePropertieAttribute[];
    collection: string;
    tier_id: number;
    tags?: string[];
    uniq_id: string;
    start_token_id: number;
    end_token_id: number;
    frozen: boolean;
}

export enum ICollectionType {
    Custom = 'Custom',
    Edition = 'Edition',
    Tiered = 'Tiered',
}

export interface IVivePropertieAttribute {
    trait_type: string;
    value: string | number;
    external?: string;
    extension?: string;
}
