import { Test, TestingModule } from '@nestjs/testing';
import { AWSAdapter, ResourceType } from './aws.adapter';
import { HttpModule, HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';
import { URL } from 'url';

describe('AWSAdapter', () => {
    let requestService: HttpService;
    let awsAdapter: AWSAdapter;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [HttpModule],
            providers: [AWSAdapter],
        }).compile();
        awsAdapter = module.get<AWSAdapter>(AWSAdapter);
        requestService = module.get<HttpService>(HttpService);
    });

    it('s3PutData should upload successfully', async () => {
        const imageUrl = faker.image.business();
        const { data } = await firstValueFrom(requestService.get(imageUrl, { responseType: 'arraybuffer' }));
        const filename = `testing###${uuidv4()}`;
        // time track
        const startTs = new Date().valueOf();
        const result = await awsAdapter.s3PutData(data, filename, ResourceType.Media, 'image/jpg');
        const duration = new Date().valueOf() - startTs;
        expect(result).toBeTruthy();
        expect(result).toEqual(new URL(filename, awsAdapter.mediaUri).toString());
        // duration should less than 3 seconds
        expect(duration).toBeLessThanOrEqual(3 * 1000);
    }, 30000);
});
