const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_';
export const generateRandomPassword = (length: number): string =>
    new Array(length)
        .fill(0)
        .map(() => charset[Math.floor(Math.random() * charset.length)])
        .join('');
