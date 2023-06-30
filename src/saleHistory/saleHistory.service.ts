import { Injectable } from '@nestjs/common';
import { EarningChart, Sale, SaleHistory } from './saleHistory.dto';
import { OpenseaService, Param } from '../opensea/opensea.service';

@Injectable()
export class SaleHistoryService {
    constructor(private openseaService: OpenseaService) {}
    /**
     * generateMoonpayUrlWithSignature creates a moonpay url with the signature.
     * @param cursor need to be a valid asset, will be passed to moonpay via query param .
     * @param address  a valid address for the currency, will be passed to moonpay as query param.
     * @returns the url with the signature created of the secret key.
     */
    async getSaleHistory(address: string, cursor: string): Promise<SaleHistory> {
        const param: Param = { asset_contract_address: address, cursor: cursor };
        const result = await this.openseaService.getCollectionEvent(param);
        result.asset_events = result.asset_events.map((sale) => ({
            ...sale,
            nftName: sale.asset.name,
            nftPicture: sale.asset.image_url,
            currentPrice: `${getCurrentPrice(sale)}`,
            rarity: sale.asset.collection.is_rarity_enabled,
            quantity: sale.quantity,
            timeListed: sale.listing_time,
            from: sale.transaction.from_account.address,
            to: sale.transaction.to_account.address,
            time: sale.event_timestamp,
        }));
        return result;
    }
    async getEarningChart(slug: string): Promise<EarningChart> {
        const params: Param = { collection_slug: slug, occurred_after: getSevenDayBefore() };
        let sale: SaleHistory;
        let result: EarningChart = { totalAmountPerDay: [] };

        do {
            sale = await this.openseaService.getCollectionEvent(params);
            params.cursor = sale.next;
            // Process data from opensea
            result = this.processData(result, sale);
        } while (sale.next != null);

        return result;
    }

    private processData(result: EarningChart, sale: SaleHistory): EarningChart {
        let dayTemp = '';
        let cantPerDay: number;
        sale.asset_events.forEach((asset, index) => {
            if (dayTemp != asset.created_date.split('T')[0]) {
                if (index != 0) {
                    result.totalAmountPerDay.push({ day: dayTemp, total: cantPerDay });
                }
                dayTemp = asset.created_date.split('T')[0];
                cantPerDay = 0;
            }
            cantPerDay += getCurrentPrice(asset);
        });

        return result;
    }
}

function getSevenDayBefore(): number {
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 7);
    return currentDate.getTime();
}

export function getCurrentPrice(sale: Sale): number {
    const priceEth = parseFloat(sale.total_price) / Math.pow(10, parseInt(sale.payment_token.decimals));
    return priceEth * parseFloat(sale.payment_token.usd_price);
}
