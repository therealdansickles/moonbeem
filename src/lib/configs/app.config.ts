export const appConfig = {
    global: {
        prefix: 'v1',
        port: process.env.PORT || 3000,
        debug: process.env.NODE_ENV === 'dev' ?? false,
    },
    cron: {
        disabled: Boolean(process.env.DISABLE_CRON),
    },
};

export const googleConfig = {
    clientId: process.env.GOOGLE_MAIL_CLIENT_ID,
};
