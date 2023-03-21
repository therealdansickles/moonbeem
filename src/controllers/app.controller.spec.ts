import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../app.module';
import { RpcClient } from '../lib/adapters/eth.client.adapter';
import { RedisAdapter } from '../lib/adapters/redis.adapter';
import { AppService } from '../services/app.service';
import { AppController } from './app.controller';
import * as request from 'supertest';

describe('AppController', () => {
    let app: INestApplication;
    let appController: AppController;
    let appService: AppService;
    let rpcClient: RpcClient;
    let redisClient: RedisAdapter;

    beforeAll(async () => {
        rpcClient = new RpcClient();
        redisClient = new RedisAdapter();
        appService = new AppService(rpcClient, redisClient);
        appController = new AppController(appService);

        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(AppService)
            .useValue(appService)
            .compile();
        app = moduleRef.createNestApplication();
        await app.init();
    });

    it('/GET getHealth', () => {
        const result = appController.getHealth();
        return request(app.getHttpServer()).get('/health').expect(200).expect({
            data: result,
        });
    });

    afterAll(async () => {
        await app.close();
    });
});
