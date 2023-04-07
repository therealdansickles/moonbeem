import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

export const mailgunConfig = {
    USERNAME: process.env.MAILGUN_USERNAME || '',
    KEY: process.env.MAILGUN_API || '',
    EMAIL_ADDRESS: process.env.EMAIL_ADDRESS,
    DOMAIN: process.env.MAILGUN_DOMAIN || '',
    BASE_URI_CONFIG: {
        DASHBOARD: process.env.DASHBOARD_URL || '',
    },
};
