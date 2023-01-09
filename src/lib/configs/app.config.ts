export const appConfig = {
    global: {
        prefix: 'v1',
        port: process.env.PORT || 3000,
        debug: process.env.NODE_ENV === 'dev' ?? false,
    },
    swagger: {
        route: 'swagger',
        prefix: 'v1',
        title: 'Vibe Restful Api Documentation',
        description: `About the restful api of marketplace, it is different from dashboard in that it uses wallet address to verify identity`,
        version: '1.0',
    },
};
