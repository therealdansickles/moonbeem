import * as dotenv from 'dotenv'; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import { json, urlencoded } from 'express';

import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as Sentry from '@sentry/node';

import { AppModule } from './app.module';
import { appConfig } from './lib/configs/app.config';

dotenv.config();

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        // running log, production: not doing anything, dev: set NODE_ENV="dev"
        logger: !appConfig.global.debug ? false : ['log', 'error', 'warn', 'debug', 'verbose'],
    });

    // configure: base route frefix
    app.setGlobalPrefix(appConfig.global.prefix, { exclude: [{ path: 'health', method: RequestMethod.GET }] });

    // configure: cros
    app.enableCors();

    // configure: sentry
    Sentry.init({
        environment: process.env.NODE_ENV,
        dsn: process.env.SENTRY_DSN,
        ignoreErrors: [
            'BAD_REQUEST',
            'GraphQLError',
            'JsonWebTokenError',
            'TokenExpiredError',
        ]
    });

    app.use(json({ limit: '100mb' }));
    app.use(urlencoded({ limit: '100mb', extended: true }));

    // configure: param validator, controlled by dto's decorator
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
        })
    );

    // listen server
    await app.listen(appConfig.global.port);
    // print some log
    console.log(`Server Starting on http://localhost:${appConfig.global.port}`);
    appConfig.global.debug ? console.log(`GraphQL Starting on http://localhost:${appConfig.global.port}/graphql`) : '';
}

bootstrap();
