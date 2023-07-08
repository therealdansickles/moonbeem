import { NextFunction } from 'express';
import { Request, Response } from 'express-serve-static-core';
import { Injectable, NestMiddleware } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();

import * as crypto from 'crypto';

export interface AlchemyRequest extends Request {
    header: any;
    alchemy: {
        body: string;
        signature: string;
    };
    body: AlchemyWebhookEvent;
    signature: any;
}

export function isValidSignatureForAlchemyRequest(request: AlchemyRequest, signingKey: string): boolean {
    return isValidSignatureForStringBody(request.body, request.header('x-alchemy-signature'), signingKey);
}

export function isValidSignatureForStringBody(
    body: AlchemyWebhookEvent,
    signature: string,
    signingKey: string
): boolean {
    const hmac = crypto.createHmac('sha256', signingKey);

    const bodyString = JSON.stringify(body);
    hmac.update(bodyString, 'utf8');
    const digest = hmac.digest('hex');
    return signature === digest;
}

@Injectable()
export class AlchemyMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        if (!isValidSignatureForAlchemyRequest(req as AlchemyRequest, process.env.ALCHEMY_SIGNKEY)) {
            const errMessage = 'Signature validation failed, unauthorized!';
            return res.status(403).send(errMessage);
        } else {
            next();
        }
    }
}

export interface AlchemyWebhookEvent {
    webhookId: string;
    id: string;
    createdAt: Date;
    type: AlchemyWebhookType;
    event: Record<any, any>;
}

export type AlchemyWebhookType = 'MINED_TRANSACTION' | 'DROPPED_TRANSACTION' | 'GRAPHQL' | 'ADDRESS_ACTIVITY';
