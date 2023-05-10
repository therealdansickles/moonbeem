import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

export const mailgunConfig = {
    USERNAME: process.env.MAILGUN_USERNAME || 'none',
    KEY: process.env.MAILGUN_API || 'none',
    EMAIL_ADDRESS: process.env.MAILGUN_EMAIL_ADDRESS || '',

    DOMAIN: process.env.MAILGUN_DOMAIN || '',
    BASE_URI_CONFIG: {
        DASHBOARD: process.env.DASHBOARD_URL || 'https://vibe.xyz',
    },
};
