import { faker } from '@faker-js/faker';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { MaasService } from './maas.service';

describe('MaasService', () => {
    let service: MaasService;

    beforeAll(() => {
        const configService = new ConfigService();
        const httpService = new HttpService();
        service = new MaasService(configService, httpService);
    });
    describe('#handleLoyaltyPointsTransfer', () => {
        it('should send request to MaaS', async () => {
            jest.spyOn(service as any, '_invoke').mockImplementation(() => ({ before: 10, after: 9 }));
            const result = await service.handleLoyaltyPointsTransfer({
                collectionId: faker.string.uuid(),
                tokenId: faker.string.numeric(1),
                metadata: {},
            });
            expect(result).toBeTruthy();
        });
    });
});
