const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_';
export const generateRandomString = (length: number): string =>
    new Array(length)
        .fill(0)
        .map(() => charset[Math.floor(Math.random() * charset.length)])
        .join('');

export const generateRandomPassword = (length: number): string => generateRandomString(length);

export const generatePluginInviteCodes = (count: number, length: number): string[] =>
    new Array(count).fill(0).map(() => generateRandomString(length));
