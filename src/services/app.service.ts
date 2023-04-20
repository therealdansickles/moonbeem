import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { FactoryConfigReqDto, FactoryConfigRspDto } from '../dto/app.dto';
import { RpcClient } from '../lib/adapters/eth.client.adapter';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter';
import { RedisAdapter } from '../lib/adapters/redis.adapter';
import { SysConfigItem, TotalRecord } from '../lib/modules/db.record.module';

@Injectable()
export class AppService {
    constructor(private readonly ethClient: RpcClient, private readonly redisClient: RedisAdapter, private readonly pgClient: PostgresAdapter) {}

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
        let status = false;

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

    async getFactoryConfig(args: FactoryConfigReqDto): Promise<FactoryConfigRspDto> {
        const rsp: FactoryConfigRspDto = {
            data: [],
            total: await (await this.countFactoryConfig(args)).total,
        };
        const data = await this.findManyFactoryConfigs(args);
        for (const item of data) {
            rsp.data.push({
                name: item.cfg_name,
                value: item.cfg_value,
                type: item.cfg_type,
                comment: item.cfg_comment,
                chainId: item.chain_id,
            });
        }
        return rsp;
    }

    async findManyFactoryConfigs(args: FactoryConfigReqDto) {
        let sqlStr = "SELECT cfg_name,cfg_value,cfg_type,cfg_comment,chain_id FROM sysconfig WHERE cfg_name LIKE '%ADDR%'";

        const values: unknown[] = [];
        if (args.chainId) {
            sqlStr = `${sqlStr} AND chain_id=?`;
            values.push(args.chainId);
        }
        const rsp = await this.pgClient.select<SysConfigItem>(sqlStr, values);
        return rsp;
    }

    async countFactoryConfig(args: FactoryConfigReqDto) {
        let sqlStr = "SELECT COUNT(*) AS total FROM sysconfig WHERE cfg_name LIKE '%ADDR%'";

        const values: unknown[] = [];
        if (args.chainId) {
            sqlStr = `${sqlStr} AND chain_id=?`;
            values.push(args.chainId);
        }
        const rsp = await this.pgClient.query<TotalRecord>(sqlStr, values);
        return rsp;
    }
}
