const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export const generateReferralCode = (length: number) =>
    Array(length).fill(null)
        .map(() => characters.charAt(Math.floor(Math.random() * characters.length))).join('');
