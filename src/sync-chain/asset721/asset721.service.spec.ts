import { faker } from '@faker-js/faker';

import { Asset721Service } from './asset721.service';

describe('Asset721Service', () => {
    let service: Asset721Service;

    beforeAll(async () => {
        service = global.asset721Service;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    describe('asset721', () => {
        it('should get an asset', async () => {
            const asset = await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getAsset721(asset.id);
            expect(result.id).toEqual(asset.id);
        });
    });

    describe('getAsset721ByQuery', () => {
        it('should get nothing', async () => {
            await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address: faker.finance.ethereumAddress(),
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getAsset721ByQuery({});
            expect(result).toBeNull();
        });

        it('should get an asset', async () => {
            const address = faker.finance.ethereumAddress();

            const asset1 = await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address,
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            await service.createAsset721({
                height: parseInt(faker.string.numeric({ length: 5, allowLeadingZeros: false })),
                txHash: faker.string.hexadecimal({ length: 66, casing: 'lower' }),
                txTime: Math.floor(faker.date.recent().getTime() / 1000),
                address,
                tokenId: faker.string.numeric({ length: 5, allowLeadingZeros: false }),
                owner: faker.finance.ethereumAddress(),
            });

            const result = await service.getAsset721ByQuery({ tokenId: asset1.tokenId, address });
            expect(result.id).toEqual(asset1.id);
        });
    });
});
