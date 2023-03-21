import { ethers } from 'ethers';
import { chainList } from '../configs/chain.list.config';

export class EthersClient {
    private client: ethers.providers.JsonRpcProvider;

    constructor(rpcURL: string) {
        this.client = this.getConn(rpcURL);
    }

    getConn(url: string) {
        return new ethers.providers.JsonRpcProvider(url);
    }

    async blockNum() {
        return await this.client.getBlockNumber();
    }

    async checkTxStatus(hash: string): Promise<ethers.providers.TransactionReceipt> {
        const rsp = await this.client.getTransactionReceipt(hash);
        return rsp;
    }
}

export class RpcClient {
    private clients: Map<string, EthersClient>;

    constructor() {
        this.clients = new Map<string, EthersClient>();
        this.init();
    }

    init() {
        for (const chainId in chainList) {
            const _c = new EthersClient(chainList[chainId]);
            this.clients.set(chainId, _c);
        }
    }

    get(chainId: string): EthersClient {
        return this.clients.get(chainId);
    }
}
