import { JwtService } from '@nestjs/jwt';
import { IGraphQLRequest } from './session.types';

export const getUserIdFromToken = (request: IGraphQLRequest, jwtService: JwtService, secret: string): string | undefined => {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type !== 'Bearer') return;
    const payload = jwtService.verify(token, { secret });
    return payload.userId;
};
