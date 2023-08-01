import { Repository } from 'typeorm';
import { faker } from '@faker-js/faker';
import { Membership } from './membership.entity';
import { User } from '../user/user.entity';
import * as jwt from 'jwt-simple';

describe('MembershipService', () => {
    let repository: Repository<Membership>;
    let userRepository: Repository<User>;

    beforeAll(async () => {
        repository = global.membershipRepository;
        userRepository = global.userRepository;
    });

    afterAll(async () => {
        global.gc && global.gc();
    });

    it('should lower case the email', async () => {
        let membership = new Membership();
        membership = repository.create(membership);
        membership.email = faker.internet.email().toUpperCase();
        await repository.insert(membership);
        membership = await repository.findOneBy({ email: membership.email.toLowerCase() });
        expect(membership.email).toBe(membership.email.toLowerCase());
    });

    it('should set the invite code', async () => {
        const user = await userRepository.save({
            username: faker.internet.userName(),
            email: faker.internet.email(),
            password: 'password',
        });

        let membership = new Membership();
        membership = repository.create(membership);
        // NOTE: oof, could be a problematic test since this is done in createMembership instead
        membership.user = user;
        membership.email = user.email;
        await repository.insert(membership);
        membership = await repository.findOneBy({ email: membership.email.toLowerCase() });
        const decoded = jwt.decode(membership.inviteCode, process.env.INVITE_SECRET);

        expect(decoded.email).toEqual(membership.email.toLowerCase());
        expect(membership.user.id).toEqual(user.id);
        expect(decoded.isNewUser).toBe(false);
    });

    it('should create a new user invite code', async () => {
        let membership = new Membership();
        membership = repository.create(membership);
        membership.email = faker.internet.email();
        await repository.insert(membership);
        membership = await repository.findOneBy({ email: membership.email.toLowerCase() });
        const decoded = jwt.decode(membership.inviteCode, process.env.INVITE_SECRET);

        expect(decoded.isNewUser).toBe(true);
    });
});
