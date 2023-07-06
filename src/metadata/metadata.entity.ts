export class MetadataProperty {
    name: string;
    type: string;
    value: any;
    display_value: string;
}

export class MetadataProperties {
    [key: string]: MetadataProperty;
}

export class MetadataRule {
    property: string;
    rule: string;
    value: any;
    update: {
        property: string;
        value: any;
    }[];
}

export class MetadataTrigger {
    type: string;
    value: string;
}

export class MetadataCondition {
    operator?: string;
    rules: Array<MetadataRule>;
    trigger: MetadataTrigger;
}

export class Metadata {
    uses: string[];
    title: string[];
    name?: string;
    type?: string;
    external_url?: string;
    image?: string;
    image_url?: string;
    properties: MetadataProperties;
    conditions: Array<MetadataCondition>;
}