import { platformPostgresConfig } from './platform.postgres.config';
import { syncChainPostgresConfig } from './sync-chain.postgres.config';

export default () => ({
    platformPostgresConfig,
    syncChainPostgresConfig
});
