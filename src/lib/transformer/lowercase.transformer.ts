import { ValueTransformer } from 'typeorm';

export const lowercaseTransformer: ValueTransformer = {
    to: function (value?: string) {
        if (value) return value.toLowerCase();
    },
    from: function (value?: string) {
        if (value) return value.toLowerCase();
    },
};
