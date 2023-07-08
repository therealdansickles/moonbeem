import { HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { faker } from '@faker-js/faker';
import { AlchemyService, FilterNft } from './alchemy.service';
import { alchemyConfig } from '../lib/configs/alchemy.config';
import { AlchemyModule } from './alchemy.module';
import { AxiosResponse, AxiosRequestHeaders } from 'axios';

describe('AlchemyService', () => {
    let service: AlchemyService;

    describe('#updateWebHook', () => {
        beforeAll(async () => {
            await Test.createTestingModule({
                imports: [AlchemyModule],
            }).compile();
            const httpRequest = new HttpService();
            service = new AlchemyService(httpRequest);
        });


        it('should return the empty data', async () => {

            let params: FilterNft[] = [];
            params.push({ contract_address: `arb:${faker.finance.ethereumAddress()}` });
            const testData = {
                webhook_id: alchemyConfig.webHookId,
                nft_filters_to_add: params,
                nft_filters_to_remove: []
            }
            const emptyResponse: AxiosResponse<any> = {
                data: null,
                status: 200,
                statusText: 'OK',
                config: {
                    headers: {} as AxiosRequestHeaders, // Aquí puedes proporcionar las headers requeridas
                },
                headers: {} as AxiosRequestHeaders,
            };

            jest.spyOn(service, 'updateWebHook').mockResolvedValue(Promise.resolve(emptyResponse));
            const result = await service.updateWebHook(testData);
            console.log(result)
            expect(result).toEqual(emptyResponse);

        });

    });
});

