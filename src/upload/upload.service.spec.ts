import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { UploadService } from './upload.service';
import { AWSAdapter, ResourceType } from '../lib/adapters/aws.adapter';
import { VUploadImageReqDto, VUploadImageRsp } from './upload.dto';

describe('UploadService', () => {
    let service: UploadService;
    let awsAdapter: AWSAdapter;

    beforeEach(async () => {
        const mockAWSAdapter = {
            s3PutData: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [UploadService, { provide: AWSAdapter, useValue: mockAWSAdapter }],
        }).compile();

        service = module.get<UploadService>(UploadService);
        awsAdapter = module.get<AWSAdapter>(AWSAdapter);
    });

    it('should upload image and return url', async () => {
        const buffer = Buffer.from('test data');
        const contentType = 'image/jpeg';
        const url = 'http://test.com/image.jpeg';

        const requestDto: VUploadImageReqDto = { buffer, contentType };
        const expectedResponse: VUploadImageRsp = { url };

        (awsAdapter.s3PutData as jest.Mock).mockResolvedValue(url);

        expect(await service.handleImage(requestDto)).toEqual(expectedResponse);
        expect(awsAdapter.s3PutData).toHaveBeenCalledWith(buffer, expect.any(String), ResourceType.Media, contentType);
    });

    it('should throw HttpException if required parameters are missing', async () => {
        const requestDto: VUploadImageReqDto = { buffer: null, contentType: null };

        const exception = new HttpException(
            {
                status: HttpStatus.BAD_REQUEST,
                error: 'missing required parameters.',
            },
            HttpStatus.BAD_REQUEST
        );

        await expect(service.handleImage(requestDto)).rejects.toThrow(exception);
    });
});
