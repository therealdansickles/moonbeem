export const enum MetadataPropertyClass {
    UPGRADABLE = 'upgradable',
    PLUGIN = 'plugin',
}

export class MetadataProperty {
    name: string;
    type: string;
    value: any;
    display_value?: string;
    class?: MetadataPropertyClass;
    updated_at?: number;
    belongs_to?: string;
}

export class MetadataProperties {
    [key: string]: MetadataProperty;
}

export class MetadataRuleUpdate {
    property: string;
    action?: string;
    value: any;
}

export class MetadataRule {
    property: string;
    rule: string;
    value: any;
    update_unit?: string;
    update: MetadataRuleUpdate[];
}

export class MetadataTriggerConfig {
    startAt: string;
    endAt: string;
    every: number;
    unit: string;
}

export class MetadataTrigger {
    type: string;
    updatedAt?: string;
    config: MetadataTriggerConfig;
}

export class MetadataCondition {
    operator?: string;
    rules: Array<MetadataRule>;
    trigger: Array<MetadataTrigger>;
}

export class MetadataConfigAlias {
    [key: string]: string;
}

export class MetadataConfigTokenScope {
    name: string;
    tokens: string[];
}
export class MetadataConfigs {
    alias?: MetadataConfigAlias;
    token_scope?: MetadataConfigTokenScope[];
}

export class Metadata {
    uses?: string[];
    title?: string;
    name?: string;
    type?: string;
    external_url?: string;
    image?: string;
    image_url?: string;
    properties?: MetadataProperties;
    conditions?: MetadataCondition;
    configs?: MetadataConfigs;
}
