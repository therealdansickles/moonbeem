export const appConfig = {
    global: {
        prefix: 'v1',
        host: process.env.HOST || 'localhost',
        port: process.env.PORT || 3000,
        debug: process.env.NODE_ENV === 'dev' ?? false,
        sql_logging: process.env.SQL_LOGGING_ENABLED === 'true' ? true : false,
    },
    cron: {
        disabled: Boolean(process.env.DISABLE_CRON),
    },
};

export const googleConfig = {
    clientId: process.env.GOOGLE_MAIL_CLIENT_ID,
};
