import { Coin } from './coin.dto';

describe('Coin', () => {
    it('should be defined', () => {
        expect(new Coin()).toBeDefined();
    });
});
