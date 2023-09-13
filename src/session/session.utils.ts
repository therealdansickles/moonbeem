import { JwtService } from '@nestjs/jwt';

export const getUserIdFromToken = (authorization: string, jwtService: JwtService, secret: string): string | undefined => {
    return getJwtPayload(authorization, jwtService, secret)?.userId;
};

export const getJwtPayload = (authorization: string, jwtService: JwtService, secret: string): any => {
    const [type, token] = authorization?.split(' ') ?? [];
    if (type !== 'Bearer') return {};
    return jwtService.verify(token, { secret });
};
