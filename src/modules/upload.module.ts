import { Module } from '@nestjs/common';
import { UploadService } from 'src/services/upload.service';
import { UploadController } from '../controllers/upload.controller';
import { SharedModule } from './share.module';

@Module({
    imports: [SharedModule],
    providers: [UploadService],
    controllers: [UploadController],
    exports: [],
})
export class UploadModule {}
