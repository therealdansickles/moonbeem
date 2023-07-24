import { Module } from '@nestjs/common';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { SharedModule } from '../share/share.module';

@Module({
    imports: [SharedModule],
    providers: [UploadService],
    controllers: [UploadController],
    exports: [],
})
export class UploadModule {}
