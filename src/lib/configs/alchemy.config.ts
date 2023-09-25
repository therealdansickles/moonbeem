export const alchemyConfig = {
    // `demo` can be the default value for alchemy apiKey
    apiKey: process.env.ALCHEMY_API_KEY || 'demo',
    authToken: process.env.ALCHEMY_AUTH_TOKEN,
    domain: process.env.ALCHEMY_DOMAIN,
    factoryContracts: {
        'arb-mainnet': process.env.ALCHEMY_FACTORY_CONTRACT_ADDRESS_ARB_MAINNET,
        'arb-goerli': process.env.ALCHEMY_FACTORY_CONTRACT_ADDRESS_ARB_GOERLI,
        'eth-mainnet': process.env.ALCHEMY_FACTORY_CONTRACT_ADDRESS_ETH_MAINNET,
        'eth-goerli': process.env.ALCHEMY_FACTORY_CONTRACT_ADDRESS_ARB_GOERLI
    }
};
