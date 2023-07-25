import { Repository } from 'typeorm';
import { User } from './user.entity';

describe('User', () => {
    let repository: Repository<User>;
    let user: User;

    beforeAll(async () => {
        repository = global.userRepository;
        user = new User();
        user.email = 'eNgIneeRinG@viBe.xyz';
        user.password = 'password';
        user = repository.create(user);
        await repository.insert(user);
        user = await repository.findOneBy({ email: 'engineering@vibe.xyz' });
    });

    //afterAll(async () => {
    //await global.clearDatabase();
    //global.gc && global.gc();
    //});

    it('should generate a hashed password', async () => {
        expect(user.password).not.toEqual('password');
    });

    it('should lowercase the email', async () => {
        expect(user.email).toEqual('engineering@vibe.xyz');
    });

    it('should generate a verification token', async () => {
        expect(user.verificationToken).toBeDefined();
    });
});
