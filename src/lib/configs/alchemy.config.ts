export const alchemyConfig = {
    url: 'https://dashboard.alchemy.com',
    apiKey: process.env.ALCHEMY_SIGNKEY,
    authKey: process.env.ALCHEMY_AUTH_TOKEN,
    webHookId: process.env.ALCHEMY_WEBHOOK_ID, // Need to create a webhook in alchemy
};
