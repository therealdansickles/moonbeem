import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { faker } from '@faker-js/faker';
import { AppModule } from '../app.module';
import { UploadController } from './upload.controller';
import { UploadService } from '../services/upload.service';
import { AppController } from './app.controller';
import { AWSAdapter } from '../lib/adapters/aws.adapter';
import { AppService } from '../services/app.service';
import { RpcClient } from '../lib/adapters/eth.client.adapter';
import { RedisAdapter } from '../lib/adapters/redis.adapter';
import { PostgresAdapter } from '../lib/adapters/postgres.adapter';

describe('UploadController', () => {
    let app: INestApplication;
    let appController: AppController;
    let uploadService: UploadService;
    let uploadController: UploadController;

    let awsAdapter: AWSAdapter;
    let requestService: HttpService;
    let appService: AppService;
    let rpcClient: RpcClient;
    let redisClient: RedisAdapter;
    let postgresClient: PostgresAdapter;

    beforeAll(async () => {
        rpcClient = new RpcClient();
        redisClient = new RedisAdapter();
        postgresClient = new PostgresAdapter();
        appService = new AppService(rpcClient, redisClient, postgresClient);

        awsAdapter = new AWSAdapter();
        uploadService = new UploadService(awsAdapter);
        uploadController = new UploadController(uploadService);

        const module: TestingModule = await Test.createTestingModule({
            imports: [AppModule, HttpModule],
        })
            .overrideProvider(AppService)
            .useValue(appService)
            .compile();

        requestService = module.get<HttpService>(HttpService);
        app = module.createNestApplication();

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    it.skip('should upload successfully', async () => {
        const imageUrl = faker.image.business();
        const { data } = await firstValueFrom(requestService.get(imageUrl, { responseType: 'arraybuffer' }));
        const file = { buffer: data, mimetype: 'image/jpeg' } as Express.Multer.File;
        const result = await uploadController.uploadImageFile(file);
        expect(result.code).toEqual(200);
        expect((result.data || ({} as any)).url).toContain(awsAdapter.mediaUri);
    }, 300000);
});
