import { firstValueFrom } from 'rxjs';

import { faker } from '@faker-js/faker';
import { HttpModule, HttpService } from '@nestjs/axios';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AWSAdapter } from '../lib/adapters/aws.adapter';
import { ResponseInternalError } from '../lib/interfaces/response.interface';
import { UploadController } from './upload.controller';
import { UploadService } from './upload.service';

describe('UploadController', () => {
    let app: INestApplication;
    let uploadController: UploadController;
    let uploadService: UploadService;

    let awsAdapter: AWSAdapter;
    let requestService: HttpService;

    const imageUrl = faker.image.urlLoremFlickr({ category: 'business' });
    const url = 'http://test.com/image.jpeg';

    beforeAll(async () => {
        awsAdapter = new AWSAdapter();

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UploadController],
            providers: [
                {
                    provide: UploadService,
                    useValue: {
                        handleImage: jest.fn().mockResolvedValue({ url }),
                    },
                },
                { provide: AWSAdapter, useValue: awsAdapter },
            ],
            imports: [HttpModule],
        }).compile();

        requestService = module.get<HttpService>(HttpService);
        app = module.createNestApplication();
        uploadController = module.get<UploadController>(UploadController);
        uploadService = module.get<UploadService>(UploadService);

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it('should upload image to S3 successfully', async () => {
        const { data } = await firstValueFrom(requestService.get(imageUrl, { responseType: 'arraybuffer' }));
        const file = { buffer: data, mimetype: 'image/jpeg' } as Express.Multer.File;

        const result = await uploadController.uploadImageFile(file);
        
        expect(uploadService.handleImage).toHaveBeenCalled();
        expect(result.code).toEqual(200);
        expect((result.data || ({} as any)).url).toContain(url);
    });

    it('should return error when uploading to S3 and service throws exception', async () => {
        const mockError = new Error('Test error');
        jest.spyOn(uploadService, 'handleImage').mockRejectedValueOnce(mockError);
        
        const file = { buffer: Buffer.from('test'), mimetype: 'image/jpeg' } as Express.Multer.File;
      
        const result = await uploadController.uploadImageFile(file);
      
        expect(result).toBeInstanceOf(ResponseInternalError);
        expect(result.msg).toBe(mockError.message);
    });
});
