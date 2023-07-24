import { Repository } from 'typeorm';
import { User } from './user.entity';

describe('User', () => {
    let repository: Repository<User>;

    beforeAll(async () => {
        repository = global.userRepository;
    });

    afterEach(async () => {
        await global.clearDatabase();
        global.gc && global.gc();
    });

    it('should generate a hashed password', async () => {
        let user = new User();
        user.email = 'eNgIneeRinG+1@viBe.xyz';
        user.password = 'password';
        await user.storeHashedPassword();
        await repository.insert(user);
        user = await repository.findOneBy({ email: 'engineering+1@vibe.xyz' });
        expect(user.password).not.toEqual('password');
    });

    it('should lowercase the email', async () => {
        let user = new User();
        user.email = 'eNgIneeRinG@viBe.xyz';
        await repository.insert(user);
        user = await repository.findOneBy({ email: 'engineering@vibe.xyz' });
        expect(user.email).toEqual('engineering@vibe.xyz');
    });
});
