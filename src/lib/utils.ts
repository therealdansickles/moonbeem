export function randomString(len?: number) {
    const _len = len ? len : 16;
    const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz0123456789';
    const maxPos = chars.length;
    let s = '';
    for (let i = 0; i < _len; i++) {
        s += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return s;
}
