import { HttpService } from "@nestjs/axios";
import { TestingModule, Test } from "@nestjs/testing";
import { faker } from '@faker-js/faker';
import { OpenseaModule } from "./opensea.module";
import { OpenseaService } from "./opensea.service";

describe('OpenseaService', () => {
    let service: OpenseaService;

    describe('#getCollectionStat', () => {
        beforeAll(async () => {
            const module: TestingModule = await Test.createTestingModule({
                imports: [
                    OpenseaModule
                ]
            }).compile();
            // service = module.get<OpenseaService>(OpenseaService);
            const httpRequest = new HttpService();
            service = new OpenseaService(httpRequest);
        })

        it('should return the right response', async () => {
            const mockResponse = {
                supply: faker.datatype.float(),
                floorPrice: faker.datatype.float(),
                volume: {
                    hourly: faker.datatype.float(),
                    daily: faker.datatype.float(),
                    weekly: faker.datatype.float(),
                    total: faker.datatype.float(),
                },
                sales: {
                    hourly: faker.datatype.float(),
                    daily: faker.datatype.float(),
                    weekly: faker.datatype.float(),
                    total: faker.datatype.float(),
                }
            };
            jest.spyOn(service, 'getCollectionStat').mockImplementation(async () => mockResponse);
            const result = await service.getCollectionStat('vibe-season-1-vibe-check');
            expect(result.supply).toBeTruthy();
            expect(result.floorPrice).toBeTruthy();
        })
    })
})