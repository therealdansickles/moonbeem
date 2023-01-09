import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisAdapter } from 'src/lib/adapters/redis.adapter';
import { RpcClient } from 'src/lib/adapters/eth.client.adapter';

@Injectable()
export class AppService {
    constructor(private readonly ethClient: RpcClient, private readonly redisClient: RedisAdapter) {}

    getHealth(): string {
        return 'ok';
    }

    /**
     *
     * @param chain chain id, example: ethereum 1
     * @param txHash transaction hash
     * @returns boolean, If the transaction is successful, save on redis and returns true, else returns false
     */
    async getTxStatus(chain: string, txHash: string): Promise<boolean> {
        let status: boolean = false;

        // get client via chain id
        const client = this.ethClient.get(String(chain));
        if (!client) {
            throw new HttpException('unsupport chaid id', HttpStatus.BAD_REQUEST);
        }

        // get redis
        const _key = this.redisClient.getKey(txHash, `${chain}_tx`);
        const redisVal = await this.redisClient.get(_key);
        if (redisVal) return redisVal;

        // check status
        const rsp = await client.checkTxStatus(txHash);
        if (rsp && rsp.status && rsp.status == 1) {
            status = true;
        }

        // set redis
        if (status) await this.redisClient.set(_key, status);
        return status;
    }
}
