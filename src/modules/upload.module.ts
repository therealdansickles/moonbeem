import { Module } from '@nestjs/common';
import { SharedModule } from './share.module.js';
import { UploadClient } from '@uploadcare/upload-client';
import { UploadController } from '../controllers/upload.controller.js';
import { UploadService } from '../services/upload.service.js';

@Module({
    imports: [SharedModule],
    providers: [
        UploadService,
        {
            provide: 'UPLOADCARE',
            useFactory: () => {
                const client: UploadClient = new UploadClient({
                    publicKey: process.env.UPLOADCARE_KEY,
                });
                return client;
            },
        },
    ],
    controllers: [UploadController],
    exports: [UploadService],
})
export class UploadModule {}
