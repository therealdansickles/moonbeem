import { SaleHistoryService } from './saleHistory.service';
import { EarningChart, SaleHistory } from './saleHistory.dto';
import { faker } from '@faker-js/faker';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { generateAssetEvent, generateEarningChart } from './saleHistory.service.spec';

export const gql = String.raw;

describe('SaleHistoryResolver', () => {
    let service: SaleHistoryService;
    let app: INestApplication;
    beforeAll(async () => {
        app = global.app;
        service = global.saleHistoryService;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('Earning Chart', () => {
        it('should get stat data', async () => {
            const query = gql`
                query ($slug: String!) {
                    getEarningChart(slug: $slug) {
                        totalAmountPerDay {
                            total
                            day
                        }
                    }
                }
            `;

            const slug = 'claw-machine-catch-the-friends';
            const variables = { slug };

            const mockResponse = generateEarningChart();
            jest.spyOn(service, 'getEarningChart').mockImplementation(async () => mockResponse);
            const earningChart: EarningChart = await service.getEarningChart(slug);

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(({ body }) => {
                    expect(body.data.getEarningChart).toEqual(earningChart);
                });
        });
    });

    describe('Sale History', () => {
        it('should get sale history', async () => {
            const query = gql`
                query ($address: String!, $cursor: String!) {
                    getSaleHistory(address: $address, cursor: $cursor) {
                        asset_events {
                            nftName
                            nftPicture
                            rarity
                            from
                            to
                            currentPrice
                        }
                        next
                    }
                }
            `;

            const address = '0xf25308d50b839a91acb3dc4366671432833bfea4';
            const variables = { address, cursor: '' };

            const mockResponse = {
                asset_events: [generateAssetEvent()],
                next: faker.company.name(),
            };
            jest.spyOn(service, 'getSaleHistory').mockImplementation(async () => mockResponse);
            const saleHistory: SaleHistory = await service.getSaleHistory(address, '');

            return await request(app.getHttpServer())
                .post('/graphql')
                .send({ query, variables })
                .expect(({ body }) => {
                    expect(body.data.getSaleHistory.asset_events[0].nftName).toEqual(
                        saleHistory.asset_events[0].nftName
                    );
                    expect(body.data.getSaleHistory.next).toEqual(saleHistory.next);
                });
        });
    });
});
