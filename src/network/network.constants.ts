import { Network } from 'alchemy-sdk';

export const NetworkMapping = new Map<number, Network>([
    [1, Network.ETH_MAINNET],
    [5, Network.ETH_GOERLI],
    [42161, Network.ARB_MAINNET],
    [421613, Network.ARB_GOERLI],
    [137, Network.MATIC_MAINNET],
    [80001, Network.MATIC_MUMBAI],
]);