import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.setGlobalPrefix('v1', {
        exclude: [{ path: 'health', method: RequestMethod.GET }],
    });
    // cros config
    app.enableCors();
    // param validator
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        })
    );
    await app.listen(process.env.PORT || 3000);
}
bootstrap();
