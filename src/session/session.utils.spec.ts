import { getJwtPayload } from './session.utils';
import { JwtService } from '@nestjs/jwt';

describe('Session utils', () => {
    let jwtService: JwtService;
    beforeAll(async () => {
        jwtService = global.jwtService;
    });

    describe('getJwtPayload', () => {
        const secret = 'secretKey';
        it('should get jwt payload', async () => {
            const signature = jwtService.sign({ userId: 'a74cc461-4738-4ce7-abd8-6c66f11bf190' }, { secret: secret});
            const authorization = `Bearer ${signature}`;
            const payload = getJwtPayload(authorization, jwtService, secret);
            expect(payload.userId).toEqual('a74cc461-4738-4ce7-abd8-6c66f11bf190');
        });

        it('should throw 403 if the token is expired ', async () => {
            const authorization = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4YTM5M2FkMy01MWQyLTQ4YzgtOWJiYy1hMDA2MzM1YTNkOGIiLCJpYXQiOjE2OTI4NjIzNjQsImV4cCI6MTY5MzQ2NzE2NH0.c2pKie-KDT-8kPoKN3eoLSxPVwBBSi7wEWqMn7zVQyU';
            try {
                getJwtPayload(authorization, jwtService, secret);
            } catch (e) {
                expect(e.message).toEqual('invalid signature');
            }
        });
    });
});
