import { Wallet } from './wallet.dto';

describe('Wallet', () => {
    it('should be defined', () => {
        expect(new Wallet()).toBeDefined();
    });
});
