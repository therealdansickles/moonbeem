import { Inject, Injectable } from '@nestjs/common';
import { VBetaWaitlistLeaderboardRsp, VBetaWaitlistScoreRsp } from 'src/dto/beta.waitlist.dto';
import { PostgresAdapter } from 'src/lib/adapters/postgres.adapter';
import { IRowCount, TbWaitlistScores, WaitlistScore } from 'src/lib/modules/db.module';
import { v4 as uuidv4 } from 'uuid';
import { ErcType, NftscanEvm } from 'nftscan-api';

@Injectable()
export class BetaWaitlistService {
    constructor(private readonly pgClient: PostgresAdapter, @Inject('NFT_SCAN') private readonly nftscan: NftscanEvm) {}

    public async getLeaderboard(page: number, pageSize: number): Promise<VBetaWaitlistLeaderboardRsp> {
        console.log(`getting leaderboard for with page ${page} and page size of ${pageSize}...`);

        const offset = page * pageSize;

        const sqlStr = `SELECT * FROM "${TbWaitlistScores}" ORDER BY points DESC LIMIT ${pageSize} OFFSET ${offset};`;
        const sqlCountStr = `SELECT COUNT(*) FROM "${TbWaitlistScores}"`;

        const countRsp = await this.pgClient.query<IRowCount>(sqlCountStr);
        const rsp = await this.pgClient.select<WaitlistScore>(sqlStr);

        const isLastPage = countRsp.count - (offset + rsp.length) <= 0;

        return {
            items: rsp,
            isLastPage,
        };
    }

    public async calculateScore(address: string): Promise<VBetaWaitlistScoreRsp> {
        const reqId = uuidv4();
        let points: number = 0;
        console.log(`[${reqId}] - Getting total sales for ${address}`);

        const nftscanResult = await this.nftscan.asset.getAssetsByAccount(address, {
            erc_type: ErcType.ERC_721, // Can be erc721 or erc1155
            limit: 1000,
        });

        const sumTrade = nftscanResult.content.reduce((sum, item) => (sum += item.latest_trade_price), 0);

        // 0.025 represents Vibe's platform fees being taken
        points = sumTrade * 0.025;

        const sqlStr = `SELECT * FROM "${TbWaitlistScores}" WHERE wallet NOT IN ('${address}') ORDER BY points DESC;`;
        const scoresRsp = await this.pgClient.select<WaitlistScore>(sqlStr);

        const leaderboard = scoresRsp.map((row) => row.points);

        let position = leaderboard
            .concat(points)
            .sort((a, b) => b - a)
            .indexOf(points);

        const sqlInsertStr = `INSERT INTO "${TbWaitlistScores}" (id,points,wallet) VALUES(?,?,?)`;
        const values: any[] = [];
        values.push(uuidv4());
        values.push(points);
        values.push(address);

        await this.pgClient.query(sqlInsertStr, values);

        const percentage = 10 + ((position - 1) / (sqlStr.length - 1)) * 90;
        const leaderboardText = percentage <= 10 ? 'top 10%' : percentage <= 50 ? 'top 50%' : 'bottom 50%';

        console.log(`[${reqId}] - returning a score of ${points} with position of ${position + 1} for address ${address}`);

        return {
            points,
            position: position + 1, // position is 0 based and we need from 1.
            leaderboard: leaderboardText,
        };
    }
}
