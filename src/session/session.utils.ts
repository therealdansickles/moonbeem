import { JwtService } from '@nestjs/jwt';
import { IGraphQLRequest } from './session.types';

export const getUserIdFromToken = (request: IGraphQLRequest, jwtService: JwtService, secret: string): string | undefined => {
    return getJwtPayload(request, jwtService, secret)?.userId;
};

export const getJwtPayload = (request: IGraphQLRequest, jwtService: JwtService, secret: string): any => {
    const authorization = request.headers.authorization;
    if (!authorization) return {};
    const [type, token] = authorization?.split(' ') ?? [];
    if (type !== 'Bearer') return {};
    return jwtService.verify(token, { secret });
};
