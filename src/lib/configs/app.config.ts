export const appConfig = {
    global: {
        prefix: 'v1',
        host: process.env.HOST || 'localhost',
        port: process.env.PORT || 3000,
        debug: process.env.DEBUG === 'true',
        sql_logging: process.env.SQL_LOGGING_ENABLED === 'true',
    },
    cron: {
        disabled: Boolean(process.env.DISABLE_CRON),
    },
};

export const googleConfig = {
    clientId: process.env.GOOGLE_MAIL_CLIENT_ID,
};
