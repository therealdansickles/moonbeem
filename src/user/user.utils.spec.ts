import { generatePluginInviteCodes, generateRandomString } from './user.utils';

describe('UserUtils', () => {
    describe('generateRandomString', () => {
        it('should generate random string', async () => {
            const result = generateRandomString(10);
            expect(result).toHaveLength(10);
            expect(result).toEqual(expect.any(String));
        });
    });

    describe('generateRandomPassword', () => {
        it('should generate random password', async () => {
            const result = generateRandomString(10);
            expect(result).toHaveLength(10);
            expect(result).toEqual(expect.any(String));
        });
    });

    describe('generatePluginInviteCodes', () => {
        it('should generate plugin invite codes', async () => {
            const result = generatePluginInviteCodes(3, 10);
            expect(result).toHaveLength(3);
            expect(result[0]).toEqual(expect.any(String));
            expect(result[1]).toEqual(expect.any(String));
            expect(result[2]).toEqual(expect.any(String));
        });
    });
});
